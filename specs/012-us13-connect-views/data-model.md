# Data Model: US13 AC04/AC05

No persistent model changes.

## Reused Entities

### Subject
- id: string
- name: string
- description: string | null
- taskCount: number

### StudyTask
- id: string
- subjectId: string
- subjectName: string
- title: string
- description: string | null
- dueDate: string | null
- status: pending | completed
- createdAt: string

## UI State Additions

### SubjectList local state
- expandedSubjectId: string | null
- subjectTasks: Record<string, StudyTask[]>
- taskStatusBySubject: Record<string, idle | loading | success | error>
- taskErrorBySubject: Record<string, string>

### RecommendedTask local state
- actionStatus: idle | loading | success | error
- actionMessage: string
