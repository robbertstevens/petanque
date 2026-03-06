# TODO.md - Petanque Competition Website

## Completed

- [x] Project setup (Next.js 16, TypeScript, Tailwind CSS v4)
- [x] Database setup (SQLite + Drizzle ORM)
- [x] Authentication (better-auth with username/password)
- [x] User registration & login pages
- [x] Dashboard page with sign out
- [x] ESLint + Prettier configuration

## To Do

### Phase 1: Core Data Models

- [ ] Add `isAdmin` field to user table
- [ ] Create `team` table (id, name, createdAt, captainUserId)
- [ ] Create `teamMember` table (teamId, userId, joinedAt)
- [ ] Create `competition` table (id, name, description, startDate, endDate, teamSize, status)
- [ ] Create `group` table (id, competitionId, name)
- [ ] Create `competitionTeam` table (competitionId, teamId, groupId)
- [ ] Create `match` table (id, groupId, homeTeamId, awayTeamId, scheduledAt, status, round, isKnockout)
- [ ] Create `matchScore` table (matchId, homeScore, awayScore, submittedByUserId, confirmedAt)
- [ ] Run migrations and push schema

### Phase 2: Team Management

- [ ] Create team page (form to create team with name)
- [ ] Team invitation system (invite users by username/email)
- [ ] Accept/decline team invitations
- [ ] View "My Teams" page
- [ ] Team detail page (view members, leave team)
- [ ] Team captain can remove members

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
