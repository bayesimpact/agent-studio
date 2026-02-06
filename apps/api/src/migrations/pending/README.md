# TypeORM migrations

## About Generation

When possible, only use the command "migration:generate" to generate migration's file (ie don't let LLM fully create migration by itself ℹ️)

Under **apps/api/src** run:
```bash
npm run migration:generate
```

By default, this will generate a ****-dontsave-mig.ts*** file in **./migrations/pending** directory

💡file that contains '**dontsave**' in name will not be committed

💡file in '**pending**' directory will not be processed

Just check, rename and move file to **./migrations** : your migration is now ready to be executed when calling 
```bash
npm run migration:run
```


#### ⚠️ Use kebab-case for file name

***🎯that-s-all-folks***
🐰
---




>ℹ️ this may create a file that will not contains all modifications that typeorm can detect
⇒ when another dev will use the typeorm command it will generate some unexpected lines, not related to what has really been modified in the entities.