// AI Assistant edge function v5 — SSE streaming, step events, friendly confirmations
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const PRIMARY_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = "llama-3.1-8b-instant";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOOLS = [
  { type: "function", function: { name: "list_spaces", description: "List all workspaces (spaces) the current user belongs to.", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "list_members", description: "List members of a space, returning each user's id, full_name, and email.", parameters: { type: "object", properties: { space_id: { type: "string" } }, required: ["space_id"] } } },
  { type: "function", function: { name: "list_tasks", description: "List tasks visible to the current user, optionally filtered.", parameters: { type: "object", properties: { space_id: { type: "string" }, status: { type: "string", enum: ["To Do", "In Progress", "Done"] }, assignee_id: { type: "string" }, search: { type: "string" }, limit: { type: "integer", minimum: 1, maximum: 50 } }, required: [] } } },
  { type: "function", function: { name: "get_task", description: "Fetch a single task with subtasks.", parameters: { type: "object", properties: { id: { type: "integer" } }, required: ["id"] } } },
  { type: "function", function: { name: "create_task", description: "Create a new task. REQUIRES USER CONFIRMATION. If you do not pass assignee_id, the task is auto-assigned to the requesting user.", parameters: { type: "object", properties: { space_id: { type: "string" }, title: { type: "string" }, description: { type: "string" }, status: { type: "string", enum: ["To Do", "In Progress", "Done"] }, priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] }, due_date: { type: "string" }, assignee_id: { type: "string" }, tags: { type: "array", items: { type: "string" } } }, required: ["space_id", "title"] } } },
  { type: "function", function: { name: "update_task", description: "Update fields on an existing task. REQUIRES USER CONFIRMATION.", parameters: { type: "object", properties: { id: { type: "integer" }, title: { type: "string" }, description: { type: "string" }, status: { type: "string", enum: ["To Do", "In Progress", "Done"] }, priority: { type: "string", enum: ["Low", "Medium", "High", "Urgent"] }, due_date: { type: "string" }, assignee_id: { type: "string" }, tags: { type: "array", items: { type: "string" } } }, required: ["id"] } } },
  { type: "function", function: { name: "delete_task", description: "Delete a task by id. REQUIRES USER CONFIRMATION.", parameters: { type: "object", properties: { id: { type: "integer" } }, required: ["id"] } } },
];

const WRITE_TOOLS = new Set(["create_task", "update_task", "delete_task"]);

const STEP_LABELS: Record<string, string> = {
  list_spaces: "Looking up your workspaces…",
  list_members: "Looking up workspace members…",
  list_tasks: "Searching tasks…",
  get_task: "Fetching task details…",
  create_task: "Preparing to create task…",
  update_task: "Preparing to update task…",
  delete_task: "Preparing to delete task…",
};

async function executeTool(supabase: SupabaseClient, name: string, args: Record<string, unknown>, userId: string): Promise<unknown> {
  try {
    switch (name) {
      case "list_spaces": {
        const { data, error } = await supabase.from("spaces").select("id, name, description").order("created_at", { ascending: false });
        if (error) throw error; return { spaces: data };
      }
      case "list_members": {
        const { data, error } = await supabase.from("space_members").select("user_id, role, profiles:user_id(id, full_name, email)").eq("space_id", args.space_id as string);
        if (error) throw error; return { members: data };
      }
      case "list_tasks": {
        let q = supabase.from("tasks").select("id, title, status, priority, due_date, assignee_id").order("created_at", { ascending: false }).limit((args.limit as number) ?? 10);
        if (args.space_id) q = q.eq("space_id", args.space_id);
        if (args.status) q = q.eq("status", args.status);
        if (args.assignee_id) q = q.eq("assignee_id", args.assignee_id);
        if (args.search) q = q.ilike("title", `%${args.search}%`);
        const { data, error } = await q;
        if (error) throw error; return { tasks: data };
      }
      case "get_task": {
        const { data, error } = await supabase.from("tasks").select("*, subtasks(*)").eq("id", args.id as number).single();
        if (error) throw error; return { task: data };
      }
      case "create_task": {
        const assigneeId = (args.assignee_id as string) ?? userId;
        const payload: Record<string, unknown> = { space_id: args.space_id, title: args.title, description: args.description ?? null, status: args.status ?? "To Do", priority: args.priority ?? "Medium", due_date: args.due_date ?? null, assignee_id: assigneeId, assignee_ids: [assigneeId], tags: args.tags ?? [], creator_id: userId };
        const { data, error } = await supabase.from("tasks").insert(payload).select().single();
        if (error) throw error; return { created: data };
      }
      case "update_task": {
        const { id, ...rest } = args as { id: number } & Record<string, unknown>;
        const { data, error } = await supabase.from("tasks").update(rest).eq("id", id).select().single();
        if (error) throw error; return { updated: data };
      }
      case "delete_task": {
        const { error } = await supabase.from("tasks").delete().eq("id", args.id as number);
        if (error) throw error; return { deleted: true, id: args.id };
      }
      default: return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: (err as Error).message ?? String(err) };
  }
}

const MAX_HISTORY_MSGS = 20;
const MAX_TOOL_CONTENT_CHARS = 2000;
const PER_USER_MSGS_PER_MINUTE = 8;

async function loadOpenAIMessages(supabase: SupabaseClient, conversationId: string) {
  const { data, error } = await supabase.from("chat_messages").select("role, content, tool_calls, tool_call_id, tool_name, pending").eq("conversation_id", conversationId).eq("pending", false).order("created_at", { ascending: true });
  if (error) throw error;
  let rows = data ?? [];
  // Keep only the last N messages
  if (rows.length > MAX_HISTORY_MSGS) rows = rows.slice(-MAX_HISTORY_MSGS);
  // Drop orphan tool messages at the start (no preceding assistant tool_calls)
  while (rows.length && rows[0].role === "tool") rows.shift();
  return rows.map((m: any) => {
    let content = m.content ?? "";
    // Truncate oversized tool outputs to keep request under TPM limits
    if (m.role === "tool" && content.length > MAX_TOOL_CONTENT_CHARS) {
      content = content.slice(0, MAX_TOOL_CONTENT_CHARS) + `\n…[truncated, ${content.length - MAX_TOOL_CONTENT_CHARS} more chars]`;
    }
    if (m.role === "tool") return { role: "tool", content, tool_call_id: m.tool_call_id };
    if (m.role === "assistant" && m.tool_calls) return { role: "assistant", content, tool_calls: m.tool_calls };
    return { role: m.role, content };
  });
}

async function saveMessage(supabase: SupabaseClient, conversationId: string, userId: string, msg: Record<string, unknown>) {
  await supabase.from("chat_messages").insert({ conversation_id: conversationId, user_id: userId, role: msg.role, content: msg.content ?? null, tool_calls: msg.tool_calls ?? null, tool_call_id: msg.tool_call_id ?? null, tool_name: msg.tool_name ?? null, pending: msg.pending ?? false });
}

// Resolve UUIDs in tool-call args to friendly names for the confirmation card
async function enrichPendingArgs(supabase: SupabaseClient, name: string, args: Record<string, any>, userId: string): Promise<Record<string, any>> {
  const out: Record<string, any> = { ...args };
  try {
    if (name === "create_task") {
      if (args.space_id) {
        const { data } = await supabase.from("spaces").select("name").eq("id", args.space_id).maybeSingle();
        if (data) out._space_name = data.name;
      }
      const assigneeId = args.assignee_id ?? userId;
      const { data } = await supabase.from("profiles").select("full_name").eq("id", assigneeId).maybeSingle();
      if (data) out._assignee_name = data.full_name;
      out._assignee_default = !args.assignee_id;
    } else if (name === "update_task" && args.id) {
      const { data } = await supabase.from("tasks").select("id, title, space_id, spaces(name)").eq("id", args.id).maybeSingle();
      if (data) {
        out._current_title = data.title;
        out._space_name = (data as any).spaces?.name;
      }
      if (args.assignee_id) {
        const { data: p } = await supabase.from("profiles").select("full_name").eq("id", args.assignee_id).maybeSingle();
        if (p) out._assignee_name = p.full_name;
      }
    } else if (name === "delete_task" && args.id) {
      const { data } = await supabase.from("tasks").select("title, spaces(name)").eq("id", args.id).maybeSingle();
      if (data) {
        out._current_title = data.title;
        out._space_name = (data as any).spaces?.name;
      }
    }
  } catch {
    // best-effort enrichment
  }
  return out;
}

class GroqRateLimitError extends Error {
  constructor() { super("RATE_LIMIT"); this.name = "GroqRateLimitError"; }
}

async function callGroqStream(messages: unknown[], model: string = PRIMARY_MODEL): Promise<Response> {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, tools: TOOLS, tool_choice: "auto", temperature: 0.2, stream: true }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 429 && model === PRIMARY_MODEL) return callGroqStream(messages, FALLBACK_MODEL);
    if (res.status === 429) throw new GroqRateLimitError();
    throw new Error(`Groq ${res.status}: ${text}`);
  }
  return res;
}

interface GroqStreamResult {
  content: string;
  tool_calls: Array<{ id: string; type: string; function: { name: string; arguments: string } }>;
}

// Parse Groq SSE stream; emit content deltas via onText, accumulate tool_calls
async function consumeGroqStream(res: Response, onText: (delta: string) => void): Promise<GroqStreamResult> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  const toolCallsByIndex: Record<number, any> = {};
  let content = "";
  let sawToolCall = false;
  let pendingText = ""; // buffer text until we know it's not a tool-call turn

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (payload === "[DONE]") continue;
      if (!payload) continue;
      let chunk: any;
      try { chunk = JSON.parse(payload); } catch { continue; }
      const delta = chunk.choices?.[0]?.delta;
      if (!delta) continue;
      if (delta.tool_calls) {
        sawToolCall = true;
        pendingText = ""; // tool-call turn — discard any buffered text
        for (const tc of delta.tool_calls) {
          const i = tc.index ?? 0;
          if (!toolCallsByIndex[i]) {
            toolCallsByIndex[i] = { id: tc.id ?? `call_${i}`, type: "function", function: { name: "", arguments: "" } };
          }
          if (tc.id) toolCallsByIndex[i].id = tc.id;
          if (tc.function?.name) toolCallsByIndex[i].function.name += tc.function.name;
          if (tc.function?.arguments) toolCallsByIndex[i].function.arguments += tc.function.arguments;
        }
      }
      if (typeof delta.content === "string" && delta.content.length) {
        content += delta.content;
        if (sawToolCall) {
          // already in tool-call mode — don't emit
        } else {
          pendingText += delta.content;
          // Flush small bursts to client
          onText(delta.content);
        }
      }
    }
  }
  // If we ended with tool calls but had emitted text, the client got partial text
  // that won't match the next turn. We accept this trade-off; Groq rarely interleaves.
  return { content, tool_calls: Object.values(toolCallsByIndex) };
}

function buildSystemPrompt(userInfo: { full_name?: string; email?: string; is_admin?: boolean }, clientDate: string, clientTz: string) {
  return `You are TaskFlow's AI Assistant. The current user is ${userInfo.full_name ?? userInfo.email ?? "unknown"}${userInfo.is_admin ? " (super admin)" : ""}.
Today (in the user's local timezone ${clientTz}) is ${clientDate}. When the user says "today", "tomorrow", "this Friday" etc., resolve them against this date — never UTC.

You help users manage tasks via tool calls. Rules:
- For any CREATE / UPDATE / DELETE tool call the user MUST confirm before it runs — the system handles that, you just emit the call.
- Before creating or updating a task, if you need a space_id or assignee_id you don't already have, call list_spaces / list_members first.
- If the user is ambiguous (e.g. "the meeting task"), call list_tasks to find candidates and ask for clarification rather than guessing.
- When creating a task, if the user does NOT specify an assignee, leave assignee_id out — the system will assign it to the current user by default.
- For tag updates, call get_task first to read existing tags, then send the merged list — do not clobber.
- Permissions: you act with this user's exact privileges. If a write fails because of RLS, explain it briefly.
- Be concise but friendly. Use short bullet lists for multiple items. Format dates as "Mon Jan 5" not raw YYYY-MM-DD when speaking to the user.`;
}

// SSE helpers
function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response(JSON.stringify({ error: "missing authorization" }), { status: 401, headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
  const user = userData.user;

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "invalid json" }), { status: 400, headers: corsHeaders }); }

  // Per-user rate limit (only count actual user messages, not confirmations)
  if (body.user_message) {
    const since = new Date(Date.now() - 60_000).toISOString();
    const { count } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("role", "user")
      .gte("created_at", since);
    if ((count ?? 0) >= PER_USER_MSGS_PER_MINUTE) {
      return new Response(
        JSON.stringify({ error: "rate_limit", message: `You're sending messages quickly — please wait a minute before trying again. (limit: ${PER_USER_MSGS_PER_MINUTE}/min per user)` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  }

  const { data: profile } = await supabase.from("profiles").select("full_name, email, is_admin").eq("id", user.id).single();

  let conversationId: string | undefined = body.conversation_id;
  if (!conversationId) {
    const { data: conv, error: convErr } = await supabase.from("chat_conversations").insert({ user_id: user.id, title: (body.user_message ?? "New conversation").slice(0, 60) }).select("id").single();
    if (convErr) return new Response(JSON.stringify({ error: convErr.message }), { status: 500, headers: corsHeaders });
    conversationId = conv!.id;
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: string, data: unknown) => controller.enqueue(encoder.encode(sseEvent(event, data)));

      try {
        send("conversation", { conversation_id: conversationId });

        // Branch: confirm pending tool call
        if (body.confirm) {
          const { tool_call_id, approved } = body.confirm as { tool_call_id: string; approved: boolean };
          const { data: pendingRows } = await supabase.from("chat_messages").select("id, tool_calls").eq("conversation_id", conversationId).eq("pending", true).order("created_at", { ascending: true });
          const pendingMsg = pendingRows?.find((r: any) => (r.tool_calls ?? []).some((tc: any) => tc.id === tool_call_id));
          if (!pendingMsg) {
            send("error", { message: "no matching pending tool call" });
            controller.close();
            return;
          }
          await supabase.from("chat_messages").update({ pending: false }).eq("id", pendingMsg.id);
          for (const tc of pendingMsg.tool_calls as any[]) {
            send("step", { label: approved ? STEP_LABELS[tc.function.name] ?? "Working…" : "Cancelling…", tool: tc.function.name });
            let result: unknown;
            if (!approved) result = { cancelled: true, message: "User cancelled this action." };
            else result = await executeTool(supabase, tc.function.name, JSON.parse(tc.function.arguments || "{}"), user.id);
            await saveMessage(supabase, conversationId!, user.id, { role: "tool", content: JSON.stringify(result), tool_call_id: tc.id, tool_name: tc.function.name });
          }
        }

        if (body.user_message) {
          await saveMessage(supabase, conversationId!, user.id, { role: "user", content: body.user_message });
        }

        const clientTz = (body.client_tz as string) || "UTC";
        const clientDate = (body.client_date as string) || new Date().toISOString().slice(0, 10);
        const systemMsg = { role: "system", content: buildSystemPrompt(profile ?? {}, clientDate, clientTz) };

        for (let step = 0; step < 8; step++) {
          const history = await loadOpenAIMessages(supabase, conversationId!);
          const messages = [systemMsg, ...history];

          send("step", { label: "Thinking…" });
          const groqRes = await callGroqStream(messages);
          const result = await consumeGroqStream(groqRes, (delta) => send("text", { delta }));

          if (result.tool_calls.length) {
            const hasWrite = result.tool_calls.some((tc) => WRITE_TOOLS.has(tc.function.name));
            if (hasWrite) {
              await saveMessage(supabase, conversationId!, user.id, { role: "assistant", content: result.content, tool_calls: result.tool_calls, pending: true });
              const enriched = await Promise.all(result.tool_calls.map(async (tc) => ({
                id: tc.id,
                name: tc.function.name,
                arguments: await enrichPendingArgs(supabase, tc.function.name, JSON.parse(tc.function.arguments || "{}"), user.id),
              })));
              send("pending", { actions: enriched, assistant_text: result.content });
              send("done", {});
              controller.close();
              return;
            }
            // read tools — execute and loop
            await saveMessage(supabase, conversationId!, user.id, { role: "assistant", content: result.content, tool_calls: result.tool_calls });
            for (const tc of result.tool_calls) {
              send("step", { label: STEP_LABELS[tc.function.name] ?? `Calling ${tc.function.name}…`, tool: tc.function.name });
              const toolResult = await executeTool(supabase, tc.function.name, JSON.parse(tc.function.arguments || "{}"), user.id);
              await saveMessage(supabase, conversationId!, user.id, { role: "tool", content: JSON.stringify(toolResult), tool_call_id: tc.id, tool_name: tc.function.name });
            }
            continue;
          }

          // Final text response
          await saveMessage(supabase, conversationId!, user.id, { role: "assistant", content: result.content });
          await supabase.from("chat_conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId!);
          send("done", {});
          controller.close();
          return;
        }
        send("error", { message: "max tool-call steps exceeded" });
        controller.close();
      } catch (err) {
        if (err instanceof GroqRateLimitError) {
          send("error", { code: "rate_limit", message: "The AI service is temporarily over its capacity. Try again in a minute." });
        } else {
          send("error", { message: (err as Error).message ?? String(err) });
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
});
