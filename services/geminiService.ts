
import { GoogleGenAI, Type } from '@google/genai';
import { Task, Employee, Priority, TaskStatus } from '../types';
import { PRIORITIES } from '../constants';

if (!process.env.API_KEY) {
  // This is a placeholder check. The actual environment variable is managed externally.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function generateTasksWithAI(
  goal: string,
  employees: Employee[]
): Promise<Pick<Task, 'title' | 'description' | 'assigneeId' | 'dueDate'>[]> {
  const employeeIds = employees.map(e => e.id);
  const employeeNames = employees.map(e => e.name).join(', ');

  const prompt = `
    Based on the following high-level goal, break it down into a list of specific, actionable tasks.
    
    Goal: "${goal}"

    Here are the available employees to assign tasks to: ${employeeNames}.
    
    For each task, provide a concise title, a brief description, a suggested assignee ID from the list [${employeeIds.join(', ')}], and a due date.
    The due date should be a reasonable number of days from today's date (${new Date().toISOString().split('T')[0]}). For example, 'YYYY-MM-DD'.
    Assign tasks logically based on what their role might be inferred from the goal. Distribute the tasks among the employees.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: 'A short, clear title for the task.',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'A brief description of what needs to be done.',
                  },
                  assigneeId: {
                    type: Type.STRING,
                    description: `The ID of the employee assigned to this task. Must be one of: ${employeeIds.join(', ')}.`,
                  },
                  dueDate: {
                    type: Type.STRING,
                    description: "The due date in YYYY-MM-DD format.",
                  },
                },
                required: ['title', 'description', 'assigneeId', 'dueDate'],
              },
            },
          },
          required: ['tasks'],
        },
      },
    });

    const jsonText = response.text ? response.text.trim() : "";
    if (!jsonText) throw new Error("AI returned an empty response.");
    const result = JSON.parse(jsonText);

    if (result && Array.isArray(result.tasks)) {
      // Validate that assigneeIds are valid
      return result.tasks.map((task: any) => ({
        ...task,
        assigneeId: employeeIds.includes(task.assigneeId) ? task.assigneeId : employeeIds[0], // fallback to first employee
      }));
    } else {
      throw new Error("AI response did not contain a valid 'tasks' array.");
    }

  } catch (error) {
    console.error('Error generating tasks with Gemini:', error);
    throw new Error('Failed to generate tasks. The AI model may be temporarily unavailable.');
  }
}


export async function getTaskAdviceFromAI(
  taskTitle: string,
  taskDescription: string,
  question: string
): Promise<string> {
  const prompt = `
    You are a helpful project management assistant. You are advising on the following task:
    - Task Title: "${taskTitle}"
    - Task Description: "${taskDescription || 'No description provided.'}"
    
    A user has the following question about this task: "${question}"
    
    Please provide a helpful, concise, and actionable response. Format your response clearly.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error('Error getting advice from Gemini:', error);
    throw new Error('Failed to get advice. The AI model may be temporarily unavailable.');
  }
}

export async function suggestTaskPriority(title: string, description: string): Promise<Priority> {
  const prompt = `
    Analyze the following task and suggest a priority level.
    - Title: "${title}"
    - Description: "${description || 'N/A'}"
    
    Consider keywords like 'urgent', 'bug', 'critical', 'blocker' for high/urgent priority, 
    and 'plan', 'research', 'draft' for lower priority.
    
    The available priority levels are: ${PRIORITIES.join(', ')}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            priority: {
              type: Type.STRING,
              description: `The suggested priority. Must be one of: ${PRIORITIES.join(', ')}`,
            },
          },
          required: ['priority'],
        },
      },
    });

    const jsonText = response.text ? response.text.trim() : "";
    if (!jsonText) throw new Error("AI returned an empty response.");
    const result = JSON.parse(jsonText);
    const suggestedPriority = result.priority as Priority;

    if (PRIORITIES.includes(suggestedPriority)) {
      return suggestedPriority;
    } else {
      console.warn(`AI suggested an invalid priority: ${suggestedPriority}. Defaulting to Medium.`);
      return Priority.MEDIUM;
    }
  } catch (error) {
    console.error('Error suggesting priority with Gemini:', error);
    throw new Error('Failed to suggest a priority.');
  }
}

export async function generateWeeklySummary(tasks: Task[], employees: Employee[]): Promise<string> {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentlyCompletedTasks = tasks.filter(task =>
    task.status === TaskStatus.DONE && task.completedAt && new Date(task.completedAt) > oneWeekAgo
  );

  const newlyCreatedTasks = tasks.filter(task =>
    new Date(task.createdAt) > oneWeekAgo
  );

  const overdueTasks = tasks.filter(task =>
    new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE
  );

  const employeeMap = new Map(employees.map(e => [e.id, e.name]));

  const formatTaskList = (taskList: Task[]) =>
    taskList.map(t => `- "${t.title}" (Assigned to: ${employeeMap.get(t.assigneeId) || 'N/A'})`).join('\n');

  const prompt = `
        You are a project manager AI. Based on the following data, generate a concise, human-readable summary of the project's progress over the last week.
        Structure the summary into sections: "Key Accomplishments", "New Tasks Created", and "Attention Needed".
        Be encouraging and professional.

        **Tasks Completed in the Last 7 Days:**
        ${recentlyCompletedTasks.length > 0 ? formatTaskList(recentlyCompletedTasks) : 'None'}

        **Tasks Created in the Last 7 Days:**
        ${newlyCreatedTasks.length > 0 ? formatTaskList(newlyCreatedTasks) : 'None'}
        
        **Currently Overdue Tasks:**
        ${overdueTasks.length > 0 ? formatTaskList(overdueTasks) : 'None'}

        Now, please generate the summary.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No summary available.";
  } catch (error) {
    console.error('Error generating summary with Gemini:', error);
    throw new Error('Failed to generate the weekly summary.');
  }
}

export async function generateSubtasks(title: string, description: string): Promise<string[]> {
  const prompt = `
    For the task titled "${title}" with description "${description}", generate a list of 3 to 6 actionable subtasks (checklist items).
    Return only the list of strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['subtasks'],
        },
      },
    });

    const jsonText = response.text ? response.text.trim() : "";
    if (!jsonText) return [];
    const result = JSON.parse(jsonText);
    return result.subtasks || [];
  } catch (error) {
    console.error('Error generating subtasks with Gemini:', error);
    throw new Error('Failed to generate subtasks.');
  }
}
export async function extractNameFromID(imageBase64: string): Promise<string> {
  const prompt = `
    Analyze this image of an ID card/badge. 
    1. Extract the full name of the employee shown.
    2. Usually, it's the most prominent name on the card.
    3. Return ONLY the name. No other text or explanation.
    4. If no name can be found, return "Unknown".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
    });

    return response.text ? response.text.trim() : "Unknown";
  } catch (error) {
    console.error('Error extracting name from ID with Gemini:', error);
    throw new Error('Failed to extract name from ID. Please enter it manually.');
  }
}
