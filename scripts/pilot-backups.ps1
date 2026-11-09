param([Parameter(Mandatory=$true)][string]$PilotProjectId, [Parameter(Mandatory=$true)][string]$NarrationProjectId)
$ErrorActionPreference = 'Stop'
if ($PilotProjectId -eq $NarrationProjectId) { throw 'Pilot and narration projects must be separate.' }
# Daily managed backup; seven days/week, retained for 30 days.
gcloud firestore backups schedules create --project=$PilotProjectId --database='(default)' --recurrence=daily --retention=30d
if ($LASTEXITCODE -ne 0) { throw 'Backup schedule was not created.' }
gcloud firestore backups schedules list --project=$PilotProjectId --database='(default)'
