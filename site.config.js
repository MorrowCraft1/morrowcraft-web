/* =========================================================================
   MORROWCRAFT SITE SETTINGS
   This is the one file you edit. Change text, links, colours, ranks, rules,
   FAQ and tabs here and the whole website updates. The data service
   (service/) reads this same file for the LuckPerms group names, the
   leaderboard stat keys and the Discord channel IDs, so you never repeat them.

   Text fields accept a little formatting:
     `code`            -> monospace chip
     **bold**          -> bold
     [text](https://x) -> link
   In "join" text you can use {javaHost} {bedrockHost} {bedrockPort} {version}.
   NEVER put passwords or tokens in this file. They go in service/.env
   ========================================================================= */
window.SITE = {

  /* ---------- Identity ---------- */
  name: "MorrowCraft",
  intro: "MorrowCraft is a semi-vanilla survival server designed for both competitive PvP and chill gameplay. There are cool unique features that make the server fun so come check it out!",
  logo: "/assets/logo.png",

  /* ---------- Colours ----------
     red / redDeep and green / greenDeep are your four brand colours (light and dark).
     bgLeft and bgRight tint the left and right edges of the page. */
  colors: {
    red: "#e90c09",
    redDeep: "#9f0809",
    green: "#55dd33",
    greenDeep: "#22aa22",
    bg: "#080d22",
    bgLeft: "#2e080d",
    bgRight: "#08301a",
    shell: "#0c1331",
    surface: "#121c42",
    surface2: "#1a2759",
    line: "#27376f",
    text: "#e9edf9",
    muted: "#9aa5c8"
  },

  /* ---------- Tabs (order and names) ----------
     Home is morrowcraft.net. Every other tab is morrowcraft.net/<id>, for example morrowcraft.net/join.
     ids must be lowercase letters. */
  tabs: [
    { id: "home",        label: "Home" },
    { id: "join",        label: "How to Join" },
    { id: "news",        label: "News" },
    { id: "leaderboard", label: "Leaderboard" },
    { id: "staff",       label: "Staff" },
    { id: "rules",       label: "Rules" },
    { id: "faq",         label: "FAQ" }
  ],

  /* ---------- Server ---------- */
  server: {
    javaHost: "play.morrowcraft.net",
    bedrockHost: "play.morrowcraft.net",
    bedrockPort: 19132,
    version: "26.2",
    versionNote: "Older Java versions can join too, thanks to ViaVersion.",
    statusRefreshSeconds: 60
  },

  /* ---------- Links ---------- */
  links: {
    store: "https://store.morrowcraft.net",
    discord: "https://discord.morrowcraft.net",
    voice: "https://voice.morrowcraft.net",
    applications: "https://discord.com/channels/1102069205290975325/1438255195199901767",
    email: "support@morrowcraft.net"
  },

  /* ---------- Where the site reads its live data from ----------
     "./data/" works when the data service writes into this folder.
     See SETUP.md for the other options. */
  data: { base: "/data/" },

  /* ---------- Home page: three big link tiles ---------- */
  tiles: [
    { title: "Store", text: "Ranks and crate keys. Everything is optional and pays for upkeep. Ranks are built to not be pay to win.", cta: "Visit the store", link: "store", tone: "green" },
    { title: "Discord", text: "Tickets, applications, announcements and the community. Join to get support and find players.", cta: "Join the Discord", link: "discord", tone: "red" },
    { title: "Voice chat", text: "Proximity voice chat for Java and Bedrock from your browser. Log in with your link from the game.", cta: "Open voice chat", link: "voice", tone: "green" }
  ],

  /* ---------- Home page: features ----------
     TO ADD A FEATURE: copy one whole line below (from { to },), paste it under the last one, change the words.
     TO EDIT: just change the text between the quotes.
     TO ADD A PICTURE: upload it to the "assets/features" folder on GitHub (Add file > Upload files), then write
     its path in image, for example image: "/assets/features/claims.png". Use image: "" for no picture.
     Text can use `code`, **bold** and [link text](https://example.com). */
  features: [
    { title: "Java + Bedrock", text: "Play from PC, console or phone. Everyone plays on the same server.", image: "" },
    { title: "Proximity voice chat", text: "Talk to players near you in game. Works for Java and Bedrock.", image: "" },
    { title: "Land claims", text: "Use a Golden Shovel or `/claim` to protect your builds. You earn claim blocks just by playing.", image: "" },
    { title: "Teams of 5", text: "Team up with up to four others. Team leaderboards track who is on top.", image: "" },
    { title: "Ranked PvP", text: "Elo, tiers and kill streaks are tracked for every player and shown on the leaderboard.", image: "" },
    { title: "Diamonds and Roses", text: "Two currencies power the server economy. Both have their own leaderboard.", image: "" }
  ],

  /* ---------- How to Join (one sub-tab per entry) ----------
     steps: a numbered list. copy: boxes with a copy button. links: extra buttons, for example
     { label: "Console video guide", url: "https://..." }.
     An entry can use sections (each with its own heading and steps) instead of steps. */
  join: [
    {
      id: "java", label: "Java Edition",
      copy: [{ label: "Server address", value: "{javaHost}" }],
      steps: [
        "Open Minecraft Java Edition and choose **Multiplayer**.",
        "Click **Add Server** and paste the address.",
        "Join on version `{version}`. {versionNote}"
      ]
    },
    {
      id: "bedrock", label: "Bedrock Edition",
      copy: [{ label: "Server address", value: "{bedrockHost}" }, { label: "Port", value: "{bedrockPort}" }],
      steps: [
        "Open Minecraft Bedrock and go to **Play, Servers, Add Server**.",
        "Enter any name, then the address and the port.",
        "Join the server. You do not need a Java account.",
        "Consoles hide the Add Server button, so Xbox, PlayStation and Switch players may need a workaround such as BedrockConnect."
      ],
      links: [
        // { label: "Console video guide", url: "https://youtube.com/..." }
      ]
    },
    {
      id: "voice", label: "Voice chat",
      copy: [{ label: "Voice website (Bedrock)", value: "https://voice.morrowcraft.net" }],
      sections: [
        {
          heading: "Java Edition",
          steps: [
            "Install the [Simple Voice Chat](https://modrinth.com/plugin/simple-voice-chat) mod for your Minecraft version and mod loader (Fabric, Forge, NeoForge or Quilt).",
            "Join the server with the mod installed.",
            "Press `V` in game to open the voice chat menu and set up your microphone."
          ]
        },
        {
          heading: "Bedrock Edition",
          steps: [
            "Join the server and type `/svg` in chat. A menu opens in game.",
            "Click **Set password** and pick your own password. It can be anything, but make sure you remember it.",
            "On your computer or phone, go to [voice.morrowcraft.net](https://voice.morrowcraft.net).",
            "Enter your password and your username with a `*` in front of it, for example `*Username`, then connect.",
            "Keep the website open and the game open at the same time. Voice chat only works while both are running."
          ]
        }
      ]
    }
  ],

  /* ---------- Staff roster ----------
     ranks: key = the exact LuckPerms group name, label = what the website shows. The order here is the
     rank order (top = highest): someone in two groups is listed once, under the higher one.
     only: ["Name"] shows just those names for that rank (used for the Owner).
     sections: how the Staff page is laid out. Each section has a title and either ranks (a list of keys)
     or groups (small headings, each with its own ranks). A rank with nobody in it shows TBD. */
  staff: {
    applyText: "Want to join the team? Applications are handled in our Discord.",
    ranks: [
      { key: "owner",           label: "Owner",             color: "#e90c09", only: ["zMorrow"] },
      { key: "manager",         label: "Staff Manager",     color: "#ffe14d" },
      { key: "trial-manager",   label: "Trial Manager",     color: "#c9bd4a" },
      { key: "develepor",       label: "Developer",         color: "#a24bff" },   // spelled this way in LuckPerms
      { key: "trial-developer", label: "Trial Developer",   color: "#b98cf0" },
      { key: "head-staff",      label: "Head Staff",        color: "#ff6a00" },
      { key: "sr-admin",        label: "Senior Admin",      color: "#ff8a1f" },
      { key: "admin",           label: "Admin",             color: "#ffab00" },
      { key: "sr-mod",          label: "Senior Moderator",  color: "#1f8fe0" },
      { key: "moderator",       label: "Moderator",         color: "#2bb3ff" },
      { key: "jr-mod",          label: "Junior Moderator",  color: "#3fd0ff" },
      { key: "trainee",         label: "Trainee",           color: "#7cf0ff" }
    ],
    sections: [
      { title: "Owner", style: "owner", ranks: ["owner"] },
      { title: "Operations", groups: [
        { title: "Management",  ranks: ["manager", "trial-manager"] },
        { title: "Development", ranks: ["develepor", "trial-developer"] }
      ] },
      { title: "Administration", ranks: ["head-staff", "sr-admin", "admin"] },
      { title: "Moderation", ranks: ["sr-mod", "moderator", "jr-mod", "trainee"] }
    ]
  },

  /* ---------- Leaderboard ----------
     key must match zLeaderboard's category key (stat_name in its database).
     useDisplay: show the plugin's display text (e.g. "3d 4h" or "HT1") instead of the raw number. */
  leaderboard: {
    limit: 200,
    categories: [
      { key: "zdiamonds_balance",     label: "Diamonds" },
      { key: "playerpoints_points",   label: "Roses" },
      { key: "statistic_time_played", label: "Playtime", useDisplay: true },
      { key: "zstats_kills",          label: "Kills" },
      { key: "zstats_deaths",         label: "Deaths" },
      { key: "zstats_elo",            label: "Elo" },
      { key: "zstats_tier",           label: "Tier", useDisplay: true },
      { key: "zstats_maxstreak",      label: "Max Streak" },
      { key: "statistic_mob_kills",   label: "Mobs Killed" },
      { key: "statistic_mine_block",  label: "Blocks Broken" },
      { key: "statistic_use_item",    label: "Blocks Placed" }
    ]
  },

  /* ---------- Discord feeds (read by the data service with your bot) ----------
     Each feed becomes a sub-tab on the News page and a file in data/. */
  discord: {
    feeds: {
      news:    { label: "News",    channelId: "1102069206444408977", limit: 8 },
      updates: { label: "Updates", channelId: "1435055898652577924", limit: 8 },
      events:  { label: "Events",  channelId: "1487099504061579414", limit: 8 }
    },
    /* Long messages get a short AI summary (needs ANTHROPIC_API_KEY in service/.env).
       The full message is always one click away. */
    aiSummaries: { enabled: true, minLength: 280 }
  },

  /* ---------- Rules ---------- */
  rules: {
    intro: "To keep MorrowCraft clean, fair and running smoothly, everyone must follow these rules.",
    warning: "Breaking the rules can lead to warnings, temporary mutes or permanent bans, depending on how serious it is and how often it happens. Staff may also act on things not listed here.",
    report: "To report someone, open a report ticket in the tickets channel on our Discord.",
    sections: [
      {
        id: "community", title: "Community Guidelines", sub: "Discord and general behaviour", numbered: true,
        items: [
          { title: "Respect & language", text: "Treat everyone with kindness. No harassment, bullying, threats, trolling or offensive or hateful language." },
          { title: "Keep it PG", text: "No adult, explicit or NSFW content (messages, images or links)." },
          { title: "No spam or ads", text: "No excessive self-promotion, advertising or spamming." },
          { title: "Privacy", text: "Never share personal details (yours or anyone else's), including real names and IP addresses." },
          { title: "Staff & Discord", text: "Follow staff instructions and abide by Discord's Terms of Service." },
          { title: "Discord's Community Guidelines", text: "Abide by Discord's Terms of Service and Community Guidelines at all times." },
          { title: "Use common sense", text: "Use some common sense, or ask staff before you do something you believe could get you punished." }
        ]
      },
      {
        id: "minecraft", title: "Minecraft Rules", sub: "How we play", numbered: true,
        items: [
          { title: "Voice chat", text: "Keep it clean, including in groups. Moderate swearing is allowed." },
          { title: "Hacks & cheats", text: "Hacked clients, X-ray and unauthorized mods are strictly banned." },
          { title: "Exploits & dupes", text: "No abusing bugs or duplication methods, including string dupers. Report them through a ticket immediately." },
          { title: "Alt accounts", text: "Alts are only allowed for AFKing farms. Never use alts to infiltrate bases, befriend players to kill them, or evade bans. Ban evasion adds up to 7 extra days." },
          { title: "Abuse & impersonation", text: "No harassment or sexual harassment of members or staff. Do not impersonate staff." },
          { title: "Appeals", text: "Ban appeals must include evidence to be considered." }
        ]
      },
      {
        id: "gameplay", title: "Gameplay Rules", sub: "PvP, teams and rare items", numbered: true,
        items: [
          { title: "No kill farming", text: "No using alts, waiting out reward cooldowns or kill trading." },
          { title: "Combat rules", text: "No danger logging, which means leaving the game when in danger. Using `/spawn` or other teleport methods to escape is fine. Do not kill players who are lagging out, it is unfair." },
          { title: "Newbie protection", text: "Do not bypass newbie protection using lava or other indirect methods." },
          { title: "Rare items (Mace, BMEs, Legendaries)", text: "Rare items must stay in your active inventory or a teammate's inventory. No stashing in chests, ender chests or alts. Exception: BME books can be stored if they are not applied to an item. BME items must be renamed to the enchant. (BME = Black Market Enchantments)" },
          { title: "Item safety", text: "Do not destroy rare items or use Curse of Vanishing. You may sell them, but the item must return to your inventory if you leave spawn." },
          { title: "Teams", text: "Maximum team size is 5. No cross-teaming, helping outsiders or double teaming enemies." },
          { title: "No stasis chambers", text: "Stasis chambers are completely banned, for both PvP and travel." },
          { title: "Griefing", text: "Griefing, stealing or breaking player builds outside of spawn is allowed." }
        ]
      },
      {
        id: "spawn", title: "Plots & Spawn", sub: "Keeping spawn tidy", numbered: true,
        items: [
          { title: "Prohibited at spawn", text: "No mob spawners, villager setups or trading halls, valuables storage, or redstone clocks (lag machines)." },
          { title: "Build standards", text: "Low effort or ugly builds (cobble boxes, random towers, lava casts, border wall blocks) will be removed by staff." },
          { title: "Economy & interaction", text: "No scamming, stealing or griefing within the spawn region." },
          { title: "AFK policy", text: "Water loops are allowed. Auto clickers used to bypass the AFK timer are banned." },
          { title: "Near spawn", text: "No lava casts, massive walls or blocking off the spawn area. This includes breaking massive amounts of blocks." },
          { title: "Pushing players", text: "Do not push anyone outside of spawn. If a mob pushes someone out, do not kill them." }
        ]
      },
      {
        id: "mods", title: "Clients & Mods", sub: "What you can and cannot run", numbered: false,
        items: [
          { heading: "Allowed mods & clients", tone: "allow", text: "Others may be allowed too. Ask staff if you are unsure." },
          { title: "Approved clients", tone: "allow", text: "Feather, Lunar and Badlion, as long as you do not enable any disallowed features in them." },
          { title: "Performance", tone: "allow", text: "Mods that improve stability and FPS are encouraged, such as Optifine, Sodium, Lithium, Phosphor and similar." },
          { title: "PvP enhancements", tone: "allow", text: "HUD elements that show status information: shield status, keystrokes, armor HUD, ping display, potion status and custom crosshairs." },
          { title: "Visuals", tone: "allow", text: "Fullbright, shulker box tooltips, low fire and low shield overlays, minimal particles and no hurt cam." },
          { title: "Building & quality of life", tone: "allow", text: "Litematica or Schematica (holograms only), AppleSkin, Remove Loading Screen and Replay Mod (content use only)." },
          { heading: "Disallowed mods & clients", tone: "deny", text: "Others may be disallowed too. Ask staff if you are unsure." },
          { title: "Clients", tone: "deny", text: "Wurst, Meteor, LiquidBounce, Impact and all hacked clients." },
          { title: "Cheats", tone: "deny", text: "Any type of cheat, including X-ray texture packs or mods, Freecam and auto-clickers." },
          { title: "PvP enhancements", tone: "deny", text: "Projectile trajectories, armor durability displays (showing other players' armor durability) and fast or quick exp." },
          { title: "Vision exploits", tone: "deny", text: "Minimaps and world maps, freelook wall clipping, skin layer exploits, pie chart and ray tracing." },
          { title: "Automation", tone: "deny", text: "Baritone, AI bots and Tweakeroo placement or action automation." }
        ]
      }
    ]
  },

  /* ---------- FAQ ----------
     TO ADD A QUESTION: copy one whole block below (from { to },), paste it under the last one, change q (the
     question) and a (the answer). Keep the quotes and the comma at the end.
     Answers can use `code`, **bold**, [link text](https://example.com) and \n for a new line. */
  faq: [
    { q: "How do I join from Bedrock Edition (iOS, Android, Xbox, Switch)?",
      a: "Add a new server on Bedrock with the address `{bedrockHost}` and port `{bedrockPort}` (the default Bedrock port). Consoles hide the Add Server button, so see the How to Join page for help." },
    { q: "How does voice chat work?",
      a: "Java players install the [Simple Voice Chat](https://modrinth.com/plugin/simple-voice-chat) mod and press `V` in game. Bedrock players type `/svg` in game, click **Set password**, then go to [voice.morrowcraft.net](https://voice.morrowcraft.net) and connect with their password and their username with a `*` in front. The website and the game must both stay open. The How to Join page has every step." },
    { q: "How do I protect my land and builds?",
      a: "Equip a Golden Shovel or run `/claim` at the corners of your area. You earn claim blocks automatically just by playing on the server." },
    { q: "Where can I submit a ban appeal or a support ticket?",
      a: "Open a ticket in our Discord at [discord.morrowcraft.net](https://discord.morrowcraft.net). Remember that ban appeals must include evidence." },
    { q: "Are store ranks pay to win?",
      a: "No. Ranks are designed to be non pay to win, though they do come with useful perks. All purchases are optional and the money goes towards upkeep and upgrades. Payments are handled by CraftingStore, Stripe and PayPal, and we never store your payment details." },
    { q: "Can I get a refund?",
      a: "All sales are final and payments are non-refundable unless stated otherwise. Subscription ranks renew automatically unless cancelled before renewal, and you can manage them through CraftingStore." }
  ],

  /* ---------- Footer ---------- */
  footer: {
    note: "MorrowCraft is not affiliated with Mojang Studios or Microsoft. Minecraft is a trademark of Mojang Studios.",
    storeNote: "Payments are processed securely by CraftingStore. MorrowCraft does not store payment information."
  }
};
