# TODO.md - Petanque Competition Website

## Completed

- [x] Project setup (Next.js 16, TypeScript, Tailwind CSS v4)
- [x] Database setup (SQLite + Drizzle ORM)
- [x] Authentication (better-auth with username/password)
- [x] User registration & login pages
- [x] Dashboard page with sign out
- [x] ESLint + Prettier configuration
- [x] Phase 1: Core Data Models
  - [x] Create `userRole` table (admin tracking via separate table)
  - [x] Create `team` table (id, name, createdAt, captainUserId)
  - [x] Create `teamMember` table (teamId, userId, joinedAt)
  - [x] Create `teamInvitation` table (with status: pending/accepted/declined)
  - [x] Create `competition` table (with status: draft/registration/group_stage/knockout/completed)
  - [x] Create `group` table (id, competitionId, name)
  - [x] Create `competitionTeam` table (competitionId, teamId, groupId)
  - [x] Create `match` table (id, groupId, homeTeamId, awayTeamId, scheduledAt, status, round, isKnockout)
  - [x] Create `matchScore` table (matchId, homeScore, awayScore, submittedByUserId, confirmedAt)
  - [x] Run migrations and push schema
- [x] Phase 2: Team Management
  - [x] Create team page (form to create team with name)
  - [x] Team invitation system (invite users by username)
  - [x] Accept/decline team invitations
  - [x] View "My Teams" page
  - [x] Team detail page (view members, leave team)
  - [x] Team captain can remove members

## To Do

### Phase 3: Competition Management (Admin)

- [ ] Admin dashboard page
- [ ] Create competition form (name, dates, team size 2-3, etc.)
- [ ] Manage groups within competition (create, rename, delete)
- [ ] Assign teams to groups
- [ ] View competition registrations
- [ ] Generate round-robin schedule for group stage
- [ ] Generate knockout bracket from group stage winners
- [ ] Override/edit match scores

### Phase 4: Competition Registration (Users)

- [ ] Browse available competitions page
- [ ] Competition detail page
- [ ] Register team for competition
- [ ] View "My Competitions" page
- [ ] Withdraw team from competition (before start)

### Phase 5: Match & Scoring

- [ ] View upcoming matches (for my teams)
- [ ] Match detail page
- [ ] Submit match score (by any team member)
- [ ] Admin can override/correct scores
- [ ] Match history page

### Phase 6: Standings & Results

- [ ] Group standings table (points, wins, losses, score differential)
- [ ] Knockout bracket visualization
- [ ] Competition results page (winners, final standings)
- [ ] Historical competition archive

## Future Enhancements (Nice to Have)

- [ ] Email notifications (match reminders, score submissions)
- [ ] Team logos/avatars
- [ ] Player statistics
- [ ] Public competition pages (spectator view)
- [ ] Mobile-responsive design improvements
- [ ] Export standings/results to PDF
