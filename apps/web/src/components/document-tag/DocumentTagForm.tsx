"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@caseai-connect/ui/shad/command"
import { Field, FieldGroup, FieldLabel, FieldSet } from "@caseai-connect/ui/shad/field"
import { Input } from "@caseai-connect/ui/shad/input"
import { Popover, PopoverContent, PopoverTrigger } from "@caseai-connect/ui/shad/popover"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronDownIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import type { DocumentTag } from "@/features/document-tags/document-tags.models"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  parentId: z.string().nullable(),
})

type DocumentTagFormData = z.infer<typeof schema>

export function DocumentTagForm({
  allTags = [],
  defaultDescription = "",
  defaultName = "",
  defaultParentId = null,
  excludeTagId,
  isLoading,
  onSubmit,
  submitLabel,
}: {
  allTags?: DocumentTag[]
  defaultDescription?: string
  defaultName?: string
  defaultParentId?: string | null
  excludeTagId?: string
  isLoading?: boolean
  onSubmit: (data: {
    name: string
    description: string | null
    parentId: string | null
  }) => Promise<void> | void
  submitLabel: string
}) {
  const [parentPickerOpen, setParentPickerOpen] = useState(false)
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DocumentTagFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultName,
      description: defaultDescription,
      parentId: defaultParentId,
    },
  })

  const availableParents = allTags.filter((tag) => tag.id !== excludeTagId)

  const handleFormSubmit = async (data: DocumentTagFormData) => {
    await onSubmit({
      name: data.name,
      description: data.description || null,
      parentId: data.parentId,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <FieldGroup>
        <FieldSet>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="tag-name">Name</FieldLabel>
              <Input
                id="tag-name"
                placeholder="Tag name"
                {...register("name")}
                disabled={isLoading}
                aria-invalid={errors.name ? "true" : "false"}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </Field>
            <Field>
              <FieldLabel htmlFor="tag-description">Description</FieldLabel>
              <Input
                id="tag-description"
                placeholder="Optional description"
                {...register("description")}
                disabled={isLoading}
              />
            </Field>
            {availableParents.length > 0 && (
              <Field>
                <FieldLabel>Parent tag</FieldLabel>
                <Controller
                  control={control}
                  name="parentId"
                  render={({ field }) => {
                    const selectedParent =
                      availableParents.find((tag) => tag.id === field.value) ?? null
                    return (
                      <div className="flex items-center gap-2">
                        <Popover open={parentPickerOpen} onOpenChange={setParentPickerOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              disabled={isLoading}
                            >
                              {selectedParent ? selectedParent.name : "None"}
                              <ChevronDownIcon className="size-3" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-56 p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search tags..." />
                              <CommandList>
                                <CommandEmpty>No tags found.</CommandEmpty>
                                <CommandGroup>
                                  {availableParents.map((tag) => (
                                    <CommandItem
                                      key={tag.id}
                                      value={tag.name}
                                      onSelect={() => {
                                        field.onChange(tag.id)
                                        setParentPickerOpen(false)
                                      }}
                                    >
                                      {tag.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {selectedParent && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={() => field.onChange(null)}
                            disabled={isLoading}
                          >
                            <XIcon className="size-3" />
                          </Button>
                        )}
                      </div>
                    )
                  }}
                />
              </Field>
            )}
            <Field orientation="horizontal" className="justify-end">
              <Button type="submit" disabled={isLoading}>
                {submitLabel}
              </Button>
            </Field>
          </FieldGroup>
        </FieldSet>
      </FieldGroup>
    </form>
  )
}
