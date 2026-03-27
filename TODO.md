# // FIXME: 
<!-- - can see project without accepting invitation (status still sent) -->
<!-- - can't delete empty project -->
- when user message is too long, it fails!!

# // TODO:
<!-- - when deleting agent or project => delete agent membership or project membership -->
<!-- - remove user in agent => remove agent membership -->
<!-- - remove user in project => remove project membership and remove agent membership on every agent of this project -->
<!-- - invite user in project => create agent membership (admin) on every agent of the project -->
<!-- - invite user in agent => create agent membership (member), project membership (member), org membership (member) -->
<!-- - rework guards to check roles based on org-membership
- rework guards to check roles based on project-membership -->
<!-- - rework guards to check roles based on agent-membership -->
<!-- - list members by agent + invite user as member to agent -->
<!-- - email must be unique -->
<!-- - org-owner -> cannot create project -->
<!-- - project-admin -> can create project -->
- create lobby at root / => list invitations to agents and project(owner/admin) and org(owner/admin)

- add zod i18n keys
- tools/helpers to seed store in storybook
- remove ttl
- delete chat session
- use moostache to compile master-prompt+variables(locale, defaultprompt)
- write LLM Rules for any IDE

## Dangerous for nest?
`--experimental-vm-modules`

org_membership: role=admin
workspace_membership: role=admin
agent_membership: role:user/admin

when creating agent -> every admin of workspace are admin in agent_membership
