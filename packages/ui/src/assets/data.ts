import { BookOpenIcon, FrameIcon } from "lucide-react"
import type { MenuItem, User } from "@/components/layouts/sidebar/types"

export const dataset: {
  sources: MenuItem[]
  expandedList: MenuItem[]
  prompts: MenuItem[]
  user: User
} = {
  expandedList: [
    {
      title: "Getting Started",
      url: "#",
      items: [
        {
          title: "Installation",
          url: "#",
        },
        {
          title: "Project Structure",
          url: "#",
        },
      ],
    },
  ],
  sources: [
    {
      title: "Internal",
      url: "#",
      icon: BookOpenIcon,
      items: [
        {
          title: "Source A",
          url: "#",
        },
        {
          title: "Source B",
          url: "#",
        },
        {
          title: "Source C",
          url: "#",
        },
      ],
    },
    {
      title: "External",
      url: "#",
      icon: BookOpenIcon,
      items: [
        {
          title: "Source A",
          url: "#",
        },
        {
          title: "Source B",
          url: "#",
        },
        {
          title: "Source C",
          url: "#",
        },
      ],
    },
  ],
  prompts: [
    {
      title: "Prompt A",
      url: "#",
      icon: FrameIcon,
    },
    {
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
