import { MenuItem, User } from "@/components/layouts/sidebar/types";
import { BookOpenIcon, FrameIcon } from "lucide-react";

export const dataset: {
  collapsibleList: MenuItem[];
  expandedList: MenuItem[];
  basicList: MenuItem[];
  user: User;
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
  collapsibleList: [
    {
      title: "Documentation",
      url: "#",
      icon: BookOpenIcon,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
  ],
  basicList: [
    {
      title: "Design Engineering",
      url: "#",
      icon: FrameIcon,
    }
  ],
  user: {
    name: "James Bond",
    email: "j@bond.com",
  },
}
