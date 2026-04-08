## ADDED Requirements

### Requirement: Activity submission link persisted on completion
When a submission is successfully analyzed and persisted, the system SHALL update the corresponding `Activity` record by setting `status = 'PENDIENTE_DE_REVISION'` and `submission_id = <new UUID>`, and SHALL increment `Student.tasks_completed` by 1.

#### Scenario: Submission with activity_id updates the activity
- **WHEN** a valid submission request includes `activity_id: 42` and the AI pipeline succeeds
- **THEN** `activities.id = 42` SHALL have `status = 'PENDIENTE_DE_REVISION'` and `submission_id` set to the new submission UUID, and `students.tasks_completed` SHALL be incremented by 1

#### Scenario: Submission without activity_id is a no-op on Activity
- **WHEN** a submission request does not include `activity_id`
- **THEN** no `Activity` record is modified and `Student.tasks_completed` is unchanged

#### Scenario: Activity not found for given activity_id
- **WHEN** `activity_id` is provided but no matching `Activity` exists
- **THEN** the Submission is persisted successfully and the Activity update failure is logged without rolling back the submission

### Requirement: activity_id accepted as optional form field on submission endpoints
All four submission endpoints (`/analyze`, `/analyze-aws`, `/analyze-audio`, `/analyze-audio-aws`) SHALL accept an optional `activity_id: int` form field.

#### Scenario: activity_id is optional
- **WHEN** a submission request is sent without `activity_id`
- **THEN** the endpoint processes normally with HTTP 200 and does not return an error

#### Scenario: activity_id is forwarded to persist_result
- **WHEN** `activity_id` is present in the form data
- **THEN** the value is passed to `submission_service.persist_result` as the `activity_id` argument

### Requirement: submission_id exposed in student activity history
`GET /api/v1/students/{id}` SHALL include `submission_id` (string UUID or null) in each item of `activity_history`.

#### Scenario: Activity with linked submission
- **WHEN** an activity has a submission_id
- **THEN** the response includes `"submission_id": "<uuid string>"` in that activity's object

#### Scenario: Activity without linked submission
- **WHEN** an activity has no submission_id
- **THEN** the response includes `"submission_id": null` in that activity's object

### Requirement: submission_id exposed in alumno task list
`GET /api/v1/me/tasks` SHALL include `submission_id` (string UUID or null) for each task.

#### Scenario: Task with linked submission
- **WHEN** the alumno has submitted a task and it was linked via activity_id
- **THEN** `submission_id` in that task is the UUID string of the linked submission

#### Scenario: Task not yet submitted
- **WHEN** the alumno has not yet submitted the task
- **THEN** `submission_id` in that task is null
