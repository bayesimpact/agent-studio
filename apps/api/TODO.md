# TODO
## Dtos
<!-- DONE - do not export 1 file per DTO (create-chat-bot.dto.ts, etc...) -->

## Dispatch
<!-- DONE - do not await dispatch on component to trigger another dispatch (ex: await dispatch(updateX) => dispatch(getX)) => solution: use middleware -->

## Routes and endpoints
- name CRUD endpoint following: getAll, updateOne, deleteOne, getOne... (do not name it "listProjects", "createProject")
<!-- DONE - replace ensureUserFromRequest by a UserGuard -->

## Tests
### Backend
- always use factory! example of missing use of factory : ```await membershipRepository.save({
        userId: user.id,
        organizationId: savedOrg.id,
        role: "owner",
      })```


## Factory
- be careful with `as ChatBot` it allows shit

# Guidelines
## Thunks
- thunk actions should be explicit listProjects, createProject
