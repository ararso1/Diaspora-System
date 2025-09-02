import { url } from "inspector";
import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        icon: Icons.HomeIcon,
        allowedRoles: [
          "Officer",
        ],
        items: [
          {
            title: "Dashboard",
            url: "/dashboard",
          },
        ],
      },
      {
        title: "Diaspora",
        icon: Icons.UserAvatar,
        allowedRoles: [
          "Officer",
        ],
        items: [
          {
            title: "Diasporas",
            url: "/diasporas",
            allowedRoles: [
              "Diaspora",
              "Officer",
            ],
          },
          {
            title: "Purposes",
            url: "/diasporas/purposes",
          },
          {
            title: "Cases",
            url: "/diasporas/cases",
          },
          {
            title: "Referrals",
            url: "/diasporas/referrals",
          },
          {
            title: "New Registration",
            url: "/diasporas/new",
            allowedRoles: [
              "Officer",
            ], 
          },
        ],
      },
      {
        title: "Reports",
        url: "/reports",
        icon: Icons.ReportsAvatar,
        allowedRoles: ["Officer"],
        items: [],
      },
      {
        title: "My Dashboard",
        url: "/diasporas",
        icon: Icons.HomeIcon,
        allowedRoles: ["Diaspora"],
        items: [],
      },
      {
        title: "Announcements",
        icon: Icons.AnnouncementsAvatar,
        allowedRoles: [
          "Officer",
          "Diaspora",
        ],
        items: [],
      },
      {
        title: "Help & Guidelines",
        url: "/help-guidelines",
        icon: Icons.HelpGuidelinesAvatar,
        allowedRoles: [
          "Officer",
          "Diaspora",
        ],
        items: [],
      },
    ],
  },

];
