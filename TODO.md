# // FIXME: 
- chat-sessions should be per chatbotId in store

# // TODO:

- create resources per orgId/projectId
- upload file to create resource 
- remove ttl
- delete chat session
- create ErrorRoute
- use moostache to compile master-prompt+variables(locale, defaultprompt)
- write e2e tests
- ProjectGuard, ChatbotGuard...
- invite user
- write LLM Rules for any IDE

## Routes and endpoints
- name CRUD endpoint following: getAll, updateOne, deleteOne, getOne... (do not name it "listProjects", "createProject")

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

# Questions
## Why?
```
// Re-export from api-contracts
export { ChatSessionStreamingRoutes } from "@caseai-connect/api-contracts"
```

## Dangerous for nest?
`--experimental-vm-modules`
