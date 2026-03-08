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
- [x] Phase 3: Competition Management (Admin)
  - [x] Admin dashboard page
  - [x] Create competition form (name, dates, team size 2-3, etc.)
  - [x] Manage groups within competition (create, rename, delete)
  - [x] Assign teams to groups
  - [x] View competition registrations
  - [x] Generate round-robin schedule for group stage
  - [x] Generate knockout bracket from group stage winners
  - [x] Override/edit match scores
- [x] Phase 4: Competition Registration (Users)
  - [x] Browse available competitions page
  - [x] Competition detail page
  - [x] Register team for competition
  - [x] View "My Competitions" page
  - [x] Withdraw team from competition (before start)
- [x] Phase 5: Match & Scoring
  - [x] View upcoming matches (for my teams)
  - [x] Match detail page
  - [x] Keep score during the match
  - [x] Submit match score (by any team member)
  - [x] Admin can override/correct scores
  - [x] Match history page
- [x] Phase 6: Standings & Results
  - [x] Group standings table (points, wins, losses, score differential)
  - [x] Knockout bracket visualization
  - [x] Competition results page (winners, final standings)
  - [x] Historical competition archive

## Phase 7: Public Competition Pages (Replaces Internal Pages)

Transform existing competition pages into public-facing pages with conditional auth-gated features.

- [ ] Refactor `/competitions` page for public access
  - [ ] Show all non-draft competitions to everyone
  - [ ] Show "Register Team" button only if authenticated + team captain
  - [ ] Show "Login to Register" CTA for anonymous users
  - [ ] Add competition search & filtering
- [ ] Refactor `/competitions/[id]` page for public access
  - [ ] Show competition details, groups, standings publicly
  - [ ] Show bracket visualization read-only
  - [ ] Show match history with scores
  - [ ] Conditional "My Matches" section (authenticated + participating only)
  - [ ] Conditional "Register/Withdraw" buttons (authenticated only)
- [ ] Add active competitions overview to homepage (`src/app/page.tsx`)
  - [ ] Display 3-5 active competitions (registration/group_stage/knockout)
  - [ ] Quick links to competition details
  - [ ] "View All Competitions" link
- [ ] Remove draft competitions from public listing (admin-only)
- [ ] Update navigation: Add public "Competitions" link
- [ ] Ensure admin routes remain at `/admin/competitions/*`

## Future Enhancements (Nice to Have)

- [ ] Loading states and skeleton screens
- [ ] Empty state illustrations for "no data" scenarios
- [ ] Breadcrumb navigation for deep pages
- [ ] Tournament seeding options (random, manual, ranking-based)
- [ ] Team performance analytics and history
- [ ] Transfer team captaincy to another member
- [ ] Email notifications (match reminders, score submissions)
- [ ] Team logos/avatars
- [ ] Player statistics
- [ ] Mobile-responsive design improvements
- [ ] Export standings/results to PDF
