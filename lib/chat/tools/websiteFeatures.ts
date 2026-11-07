export const websiteMainInfo = {
  plans: {
    id: "plans",
    title: "Plans and Offers",
    href: "/plans/",
    features: [
      {
        id: "browse-plans",
        description:
          "Browse available plans and compare their features. Each plan is related to a service, so a service may have more than one plan.",
        href: "/plans",
      },
      {
        id: "plan-duration-and-renewal",
        description:
          "Every plan runs for 30 days from the moment you subscribe. It never renews by itself — press Renew whenever you want another 30 days.",
      },
      {
        id: "plan-allowances",
        description:
          "Allowances are shared per service, not per plan. If you hold two different plans that include the same service, their allowances add up. Credits (downloads, requests, and the like) are added to your balance every time you subscribe; renewing early stacks them up.",
      },
      {
        id: "project-slots",
        description:
          "Project slots = how many projects you can keep published at once. Renewing the same plan extends your time — it does NOT add slots. Subscribe to a different plan for more slots.",
      },
      {
        id: "when-a-plan-ends",
        description:
          "Nothing is ever deleted. If you have more projects than your remaining slots allow, the newest projects are locked and your oldest projects stay published. Subscribe again and locked projects unlock automatically, oldest first, up to your new number of slots. Unused credits belong to the subscription that granted them and end with that subscription. Archiving a project frees its slot immediately; restoring a project takes a slot back.",
      },
      {
        id: "plan-payment",
        description:
          "You pay once per 30-day period at the price shown on the plan. While an offer is running, you pay the discounted price shown on the card; if the offer ends before you confirm, we ask you first and the regular price applies. A subscription runs to the end of its 30 days and cannot be cancelled midway or refunded for the remaining days. We remind you 7 days before your last active subscription in a plan expires.",
      },
    ],
  },

  votesAndComments: {
    id: "votesAndComments",
    title: "Votes and comments",
    features: [
      {
        id: "leave-an-opinion",
        description:
          "Each user can add only one opinion, and only if they requested a verification mark and the admin granted it. From the services page they can add their opinion there; writing again updates the current opinion instead of creating a new one.",
      },
      {
        id: "leave-a-comment-on-a-project",
        description: "Each user can add only one comment per project.",
      },
      {
        id: "rate-a-project",
        description:
          "Rate a project based on how good it looks by clicking the stars on top of the comment the user adds.",
      },
      {
        id: "vote-on-a-project",
        description:
          "Vote on a project by clicking the love icon under the project card.",
      },
    ],
  },

  messages: {
    id: "messages",
    title: "Messages to the company",
    features: [
      {
        id: "request-a-project",
        description:
          "Each user can select the service and the section beside it, answer the required information if present, write the message, and send it. If any of these is missing, the message will not be sent. It goes to the company, who review it and inform the user of its status. The user can access their sent messages from their profile → Messages tab → Requesting Project tab, where they see their messages and their statuses. If it takes too long without a reply, the website shows a Notify Us link that notifies the company; if the link is not shown, tell the user to wait until either the Notify Us link appears or the company reviews it. When the company reviews the request, the user gets a notification.",
      },
      {
        id: "ask-an-expert",
        description:
          "Each user can select the service and the expert they want to ask, write the message, and send it to the company. The user can access their sent messages from their profile → Messages tab → Experts Messages tab, where they see their messages and their statuses. If it takes too long without a reply, the website shows a Notify Us link that notifies the company; if the link is not shown, tell the user to wait until either the Notify Us link appears or the company reviews it. When the company reviews the request, the user gets a notification.",
      },
      {
        id: "contact-us",
        description:
          "Each user can contact the company from the Contact Us page by writing a message and sending it, or reach the company using the numbers and email shown on the page and in the footer's contact info section.",
      },
    ],
  },

  offers: {
    id: "offers",
    title: "Offers",
    href: "/offers/",
    features: [
      {
        id: "buy-an-offer-flow",
        description:
          "When a user buys an offer, the company receives the order and checks its request status, which starts as pending. Every change of the offer status sends the user a notification, and the user can check the current offer status from their profile → Offers tab. A user is only allowed to order an offer once.",
      },
    ],
  },

  profileInformation: {
    id: "profileInformation",
    title: "Profile information",
    features: [
      {
        id: "accessing-profile",
        description:
          "On large-screen devices, open the profile from the user image icon, then click Your Profile. On small screens, open it by clicking the menu icon in the nav bar, then Your Profile.",
      },
      {
        id: "editing-profile-image",
        description:
          "The user can edit the profile image by clicking the pen icon on the image, choosing an image, then clicking Save.",
      },
      {
        id: "editing-profile-information",
        description:
          "Each user can edit their profile information by clicking Edit Your Profile Data under the account name. Some basic information appears under the Complete Your Profile accordion.",
      },
      {
        id: "share-your-profile-button",
        description:
          "Clicking it copies the user's profile link so they can share it. The page shows only the user's public information and their non-expired contributions listed under their name and public information.",
      },
      {
        id: "offers-tab",
        description:
          "When a user buys an offer, they can reach their request status from the Offers tab in their profile, and the company notifies the user when the status of the requested offer changes. The user pays for and buys the offer first.",
      },
      {
        id: "plans-tab",
        description:
          "When a user subscribes to a plan, they can access their plans from the Plans tab in their profile, where the plans are listed with their expiration date and the important credit information.",
      },
      {
        id: "contribution-tab",
        description:
          "When a user subscribes to a plan that includes the Upload a Project feature, they can upload and modify projects from this page.",
      },
    ],
  },

  careers: {
    id: "careers",
    title: "Careers",
    href: "/careers/",
    features: [
      {
        id: "browse-job",
        description:
          "Open the Careers page, then scroll to find the open job opportunities.",
      },
    ],
  },
} as const;

export type WebsiteSectionId = keyof typeof websiteMainInfo;
