# RETROSPECTIVE (Team 02)

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs. done: 2 vs 3
- Total points committed vs. done: 26 vs 34
- Nr of hours planned vs. spent (as a team): 82h vs 84h

**Remember** A story is done ONLY if it fits the Definition of Done:

- Unit Tests passing
- Code review completed
- Code present on VCS
- End-to-End tests performed

> Please refine your DoD if required (you cannot remove items!)

### Detailed statistics

| Story                                          | # Tasks | Points | Hours est. | Hours actual |
| ---------------------------------------------- | ------- | ------ | ---------- | ------------ |
| _Uncategorized_                                | 13      | -      | 4d 5h    | 4d 7h 20m    |
| Point selection on the map                     | 4       | 13     | 1d 2h      | 6h 45m     |
| Upload citizen report                          | 8      | 5      | 2d 30m       | 2d 6h 15m       |
| Approve or reject reports by municipal officer | 9       | 5      | 2d 4h 30m    | 1d 7h 25m        |

> story `Uncategorized` is for technical tasks, leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean  | StDev |
| ---------- | ----- | ----- |
| Estimation | 2.47h | 2.66h |
| Actual     | 2.41h | 2.66h |

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

$$\frac{\sum_i \text{spent}_{task_i}}{\sum_i \text{estimation}_{task_i}} - 1 = 2.4 \%$$

**Result:** The total estimation error is **2.4%**, which means that the effective work required about 2.4% more time, compared to what was estimated.

- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

$$\frac{1}{}\sum_{i=1}^{} \left| \frac{spent_{task_i}}{estimation_{task_i}}-1 \right| \approx  43\%$$

**Meaning:** The average absolute error per single task is **43%**, which tells us that, on average, every single esteem deviated from the effective value of about 43%. Such a value is higher than the total error (2.4%) because some errors have compensated each other (some esteems were too high, others too low).

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated - `3h`
  - Total hours spent - `2h 40m`
  - Nr of automated unit test cases - `127`
  - Coverage - `92.11%`
- E2E testing:
  - Total hours estimated - `10h`
  - Total hours spent - `8h 10m`
  - Nr of test cases - `107`
- Code review
  - Total hours estimated - `10h`
  - Total hours spent - `7h 35m`

## ASSESSMENT

- What did go wrong in the sprint?

  > We didn't complete all the planned story for this sprint.

- What caused your errors in estimation (if any)?

  > Some tasks were underestimated because of unexperience of team members with some technologies.
  For the last story, we have underestimated the tasks: thus, by the time we have realized, we did not have enough time. Moreover, there were database changes that we have not anticipated, which caused last minute changes on both frontend and backend, causing too many files to be edited at the last day.

- What lessons did you learn (both positive and negative) in this sprint?

  > A positive lesson that we learned is that internal deadlines are good to keep the team on track for the whole sprint work.

  >A negative lesson that we have learnt is that during the sprint planning we should think about tasks we are going to implement and how we are going to implement them. This way, we can see the sprint ahead of us and if there is a change in the project that is going to effect the most of the project, we can be prepared for it.
  
  > Also unexpected events (like cloud infrastructures failures) happens and make loose some time.

- Which improvement goals set in the previous retrospective were you able to achieve?

  > We have set an internal deadline during the sprint, that was useful to keep on track with the work. 
  > We were also more specific on most of the tasks that we created at sprint planning.

- Which ones you were not able to achieve? Why?

  > We have achieved all the goals set in the previous retrospective.

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

  > One of the goal for next sprint is to spend more time during sprint planning to think about what to do in each task more accurately, trying to think about all the necessary operations to actually complete the task. 
  > Another goal that we would like to achieve is to have all the source code (APIs, controllers logic, frontend) ready for each story at least three days before the demo, in order to have time for testing everything and to have a meeting were we check all the functionalities that we are going to present during the demo.

- One thing you are proud of as a Team!!

  > The stories that we completed were working smoothly and the stakeholders were happy about the work done for those stories.
