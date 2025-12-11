# RETROSPECTIVE (Team 02)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs done : 3 vs 3
- Total points committed vs done : 19 vs 19
- Nr of hours planned vs spent (as a team) : 87h 30m vs 77h 10m

**Remember** a story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD

### Detailed statistics

| Story           | # Tasks | Points | Hours est. | Hours actual |
| --------------- | ------- | ------ | ---------- | ------------ |
| _Uncategorized_ | 11        | -      |    41h        |    36h 25m          |
| PT-06 Approve or reject reports by municipal officer               |    10     |     8   |    20h 30m        |       20h 10m       |
| PT-08 Show assigned reports to technical office staff members               |    7     |     3   |    13h 30m        |       8h 50m       |
| PT-24 Assign reports to external maintainers                |    7     |     8   |    12h 30m        |       11h 45m       |

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task (average, standard deviation)
- Total task estimation error ratio: sum of total hours estimation / sum of total hours spent -1

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated 3h
  - Total hours spent 1h 30m
  - Nr of automated unit test cases 161
  - Coverage (if available) 91.42%
- Integration testing:
  - Total hours estimated 3h
  - Total hours spent 2h
- E2E testing:
  - Total hours estimated 10h 30m
  - Total hours spent 8h 55m
- Code review:
  - Total hours estimated 15h
  - Total hours spent 12h 35m
- Technical Debt management:
  - Strategy adopted
  - Total hours estimated estimated at sprint planning 5h
  - Total hours spent 4h 30m

## ASSESSMENT

- What caused your errors in estimation (if any)?

  > On this sprint we have overestimated some tasks, like code reviews, testing and bugfixing.

- What lessons did you learn (both positive and negative) in this sprint?

  > Positive lesson: We learned that planning is essential and spending more time on it could save much more time down the line.
  > Negative lesson: every team member must double-check if all the task requirements are implemented so that it doesn't cause problems for other members who are working on tasks related to that one.

- Which improvement goals set in the previous retrospective were you able to achieve?
  > We achieved both goals we set at the previous rertospective; during the sprint planning we created more detailed tasks and we managed to finish the source code (except tests) within our internal deadline.
- Which ones you were not able to achieve? Why?

  > We have achieved all the goals set in the previous retrospective.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > When implementing a development task we refactor or change a backend logic some of the tests implemented may not pass anymore, these tests will be fixed in a technical debt task. The member that changes the backend code should add a comment to the TB task to specify the changes to save time for the test developer.

- One thing you are proud of as a Team!!
  > We managed to finish the source code (except tests) within our internal deadline, which was 2 days before the demo.
