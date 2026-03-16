# // FIXME: 
- when user message is too long, it fails!!
- can't delete empty project

# // TODO:
- add zod i18n keys
- tools/helpers to seed store in storybook
- remove ttl
- delete chat session
- use moostache to compile master-prompt+variables(locale, defaultprompt)
- write LLM Rules for any IDE

## Routes and endpoints
- name CRUD endpoint following: getAll, updateOne, deleteOne, getOne... (do not name it "listProjects", "createProject")

## Factory
- be careful with `as agent` it allows shit

# Guidelines
## Thunks
- thunk actions should be explicit listProjects, createProject

# Questions
## Why?
```
// Re-export from api-contracts
export { AgentSessionStreamingRoutes } from "@caseai-connect/api-contracts"
```

## Dangerous for nest?
`--experimental-vm-modules`
