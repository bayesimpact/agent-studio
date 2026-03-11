"use client"

import { Button } from "@caseai-connect/ui/shad/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@caseai-connect/ui/shad/command"
import { Popover, PopoverContent, PopoverTrigger } from "@caseai-connect/ui/shad/popover"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import type { DocumentTag } from "@/features/document-tags/document-tags.models"
import { createDocumentTag } from "@/features/document-tags/document-tags.thunks"
import { useAppDispatch } from "@/store/hooks"

export function DocumentTagPicker({
  allTags,
  attachedTagIds,
  onAdd,
}: {
  allTags: DocumentTag[]
  attachedTagIds: string[]
  onAdd: (tagId: string) => void
}) {
  const dispatch = useAppDispatch()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const availableTags = allTags.filter((tag) => !attachedTagIds.includes(tag.id))
  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase()),
  )
  const hasExactMatch = availableTags.some((tag) => tag.name.toLowerCase() === search.toLowerCase())
  const showCreate = search.trim().length > 0 && !hasExactMatch

  const handleSelect = (tagId: string) => {
    onAdd(tagId)
    setOpen(false)
    setSearch("")
  }

  const handleCreate = async () => {
    const newTag = await dispatch(createDocumentTag({ fields: { name: search.trim() } })).unwrap()
    onAdd(newTag.id)
    setOpen(false)
    setSearch("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <PlusIcon className="size-3" />
          Add tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search tags..." value={search} onValueChange={setSearch} />
          <CommandList>
            {filteredTags.length === 0 && !showCreate && (
              <CommandEmpty>No tags available.</CommandEmpty>
            )}
            {filteredTags.length > 0 && (
              <CommandGroup>
                {filteredTags.map((tag) => (
                  <CommandItem key={tag.id} onSelect={() => handleSelect(tag.id)}>
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreate && (
              <>
                {filteredTags.length > 0 && <CommandSeparator />}
                <CommandGroup>
                  <CommandItem onSelect={handleCreate}>
                    <PlusIcon />
                    Create &ldquo;{search.trim()}&rdquo;
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
