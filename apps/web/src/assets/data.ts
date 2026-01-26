import { BookOpenIcon, FrameIcon } from "lucide-react"
import type { MenuItem, User } from "@/components/sidebar/types"

export const dataset: {
  sources: MenuItem[]
  expandedList: MenuItem[]
  prompts: MenuItem[]
  user: User
} = {
  expandedList: [
    {
      id: "getting-started",
      title: "Getting Started",
      url: "#",
      items: [
        {
          id: "installation",
          title: "Installation",
          url: "#",
        },
        {
          id: "project-structure",
          title: "Project Structure",
          url: "#",
        },
      ],
    },
  ],
  sources: [
    {
      id: "internal",
      title: "Internal",
      url: "#",
      icon: BookOpenIcon,
      items: [
        {
          id: "source-a-internal",
          title: "Source A",
          url: "#",
        },
        {
          id: "source-b-internal",
          title: "Source B",
          url: "#",
        },
        {
          id: "source-c-internal",
          title: "Source C",
          url: "#",
        },
      ],
    },
    {
      id: "external",
      title: "External",
      url: "#",
      icon: BookOpenIcon,
      items: [
        {
          id: "source-a-external",
          title: "Source A",
          url: "#",
        },
        {
          id: "source-b-external",
          title: "Source B",
          url: "#",
        },
        {
          id: "source-c-external",
          title: "Source C",
          url: "#",
        },
      ],
    },
  ],
  prompts: [
    {
      id: "prompt-a",
      title: "Prompt A",
      url: "#",
      icon: FrameIcon,
    },
    {
      id: "prompt-b",
      title: "Prompt B",
      url: "#",
      icon: FrameIcon,
    },
  ],
  user: {
    name: "James Bond",
    email: "j@bond.com",
  },
}
