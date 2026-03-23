# // FIXME: 

- new mig: org-role-member => projects-role-member => agents-role-member
- new mig: org-role-owner => projects-role-owner => agents-role-owner
- new mig: org-role-admin => projects-role-admin => agents-role-admin

- when user message is too long, it fails!!
- can't delete empty project

# // TODO:
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
