# Reverie — Product & Implementation Plan

## The App
A mobile dream journal where users type about their dreams and AI generates images based on what they write. Immersive night sky UI — each calendar day appears as a star, text renders in a wispy/ethereal style, generated images fade in behind the text.

After journaling, users can tap **"Weave this dream"** to generate a dreamy video stitched from their saved images.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Mobile | React Native + Expo | Single codebase iOS/Android, Skia + Reanimated for animations |
| Backend | Supabase | Auth + DB + Storage + Realtime in one |
| API proxy | Cloudflare Workers | Rate limiting, hides API keys from client |
| Offline | WatermelonDB | Purpose-built relational offline-first for RN |
| Image gen | fal.ai (FLUX) | Sub-10s latency, webhook support, great surreal quality |
| Video gen | Kling/Runway/Pika via fal.ai | Image-to-video post-session, async |
| Text AI | Claude Haiku | Dream interpretations + manifestation text |
| Payments | RevenueCat | Only real choice for mobile subscriptions |
| Monorepo | pnpm workspaces | Shared types between app and Worker |

---

## Monetization

### Free Tier
- Manual "generate" button
- **5 image generations/month** (enough for a wow moment, cost: ~$0.015)
- 2 dream readings/month
- Cost to serve: ~$0.065/user/month

### Paid Tier — $7.99/mo or $59.99/yr (~$5/mo effective)
- Auto-generate on typing pause (3-second debounce)
- Unlimited image generations
- **"Weave this dream"** — image-to-video post-session (capped at 5 videos/month)
- Unlimited interpretations + manifestations
- Cost to serve: ~$0.97/user/month → ~80% gross margin

### Revenue Projections (at $7.99/mo, after ~20% App Store cut)

| Subscribers | Gross/mo | App Store (~20%) | API/Infra | Net Profit |
|---|---|---|---|---|
| 100 | $799 | -$160 | -$59 | **~$580/mo** |
| 500 | $3,995 | -$799 | -$295 | **~$2,901/mo** |
| 2,000 | $15,980 | -$3,196 | -$1,180 | **~$11,604/mo (~$139k/yr)** |
| 5,000 | $39,950 | -$7,990 | -$2,950 | **~$29,010/mo (~$348k/yr)** |

**App Store cuts:** Apple 15% (Small Business Program, under $1M/yr), Google 15%. Blended ~20%.

### Unit Economics (per paid user at 500 subscribers)
| Cost | Monthly |
|---|---|
| Apple/Google cut | ~$1.60 |
| fal.ai image generation | ~$0.24 |
| Kling video (occasional) | ~$0.26 |
| Claude Haiku | ~$0.03 |
| Supabase Pro (amortized) | ~$0.05 |
| Cloudflare Workers (amortized) | ~$0.01 |
| **Total cost per user** | **~$2.19** |
| **Net per user** | **~$5.80 (~73% margin)** |

---

## Design Concepts

### Night Sky UI
- User feels like they're looking up at stars
- Calendar days = stars; twinkling via Reanimated loops
- Star size/brightness reflects number of entries for that day
- Constellation lines connect consecutive days with entries

### Wispy Text
- Skia renders text in two layers: large blur + low opacity (glow halo), sharp on top
- Animated shimmer sweeps across periodically
- Native TextInput sits invisibly on top for keyboard/cursor behavior

### Image Fade-In
- Generated image appears behind text at opacity 0
- Reanimated interpolates to 0.6 over 1500ms with easing
- BlurView + dark gradient overlay keeps text readable
- Text layer never moves during transition

### "Weave This Dream" — Post-Session Video
```
END OF JOURNAL SESSION
  User has saved 3+ images.
  Entry closes → star calendar view.

  On the entry card: [✦ Weave this dream]

  Tap → images shown as filmstrip preview
  "Your dream is crystallizing..."

  ~60 seconds later: push notification
  "Your dream from last night is ready"

  Tap → entry opens with dreamy video playing behind the text
```
Uses the user's own generated images as reference frames — video looks like *their* dream.

### Typography
- **Cormorant Garamond** — editorial, dreamlike (headings, entry text)
- **DM Sans** — UI legibility (labels, buttons)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Native App                    │
│  Night Sky Calendar │ Journal Entry │ Vision Board  │
│  Zustand (UI) │ TanStack Query │ WatermelonDB       │
└─────────────────────────────────────────────────────┘
                         │
              Cloudflare Workers (Edge)
  /api/generate-image  → fal.ai FLUX
  /api/generate-video  → Kling (image-to-video)
  /api/interpret-dream → Claude Haiku
  /api/subscription    → RevenueCat webhook
                         │
                      Supabase
         Auth │ PostgreSQL │ Storage │ Realtime
```

### Database Schema
```
users               — id, email, subscription_tier, generations_used_this_month
dream_entries       — id, user_id, body_text, dream_date, mood_tags
dream_generations   — id, entry_id, type (image|video|interpretation|manifestation),
                      media_url, is_saved, created_at
generation_jobs     — id, entry_id, status (pending|processing|complete|failed),
                      provider_job_id
```

---

## Phased Plan

### Phase 0 — Foundation (2-3 days)
Monorepo, Expo project, EAS profiles, Supabase provisioning, Cloudflare Workers, RevenueCat setup in App Store Connect + Play Console, GitHub Actions CI

### Phase 1 — MVP Core (2-3 weeks)
- Auth (email + Apple/Google Sign-In)
- Navigation shell + night sky background (static)
- Journal entry screen with Skia wispy text
- WatermelonDB local save + Supabase sync
- Cloudflare Worker image generation endpoint
- fal.ai + prompt engineering pipeline
- Image fade-in animation + save/reject UX
- Night sky calendar (static), Gallery screen
- TestFlight + Google Play Internal Testing

### Phase 2 — Subscriptions + Premium (1-2 weeks)
- RevenueCat paywall + purchase flow
- Entitlement checking in app + Worker middleware
- Auto-generate debounce hook (premium)
- Claude Haiku dream interpretations + manifestation cards
- "Weave this dream" image-to-video (Kling) + push notifications

### Phase 3 — Delight + Launch (1-2 weeks)
- Animated twinkling star calendar + constellation lines
- Vision board masonry grid + share to camera roll
- Onboarding flow + daily reminder notifications
- App Store submission (privacy policy, screenshots, preview video)

**Total: ~6-8 weeks to submission. Bottleneck is App Store review (1-3 days), not code.**

---

## Key Technical Challenges

1. **Prompt engineering** — Two-step pipeline: Claude Haiku extracts a visual scene from vague dream text, then style anchors appended before fal.ai. Cache the extracted prompt.
2. **Offline sync conflicts** — Last-write-wins per field. Surface "two versions found" UI if body text conflicts; never silently overwrite.
3. **App Store AI content policy** — fal.ai safety checker + Cloudflare prompt filtering + content policy in ToS + Report button on every generation.

---

## What's Already Built (as of March 2026)

All Phase 0 + most of Phase 1 scaffolding complete:
- [x] Monorepo root (package.json, pnpm-workspace.yaml, .gitignore)
- [x] Expo mobile app with TypeScript
- [x] Cloudflare Workers project
- [x] Supabase migrations + schema
- [x] Theme constants + design tokens
- [x] NightSkyBackground (Skia canvas)
- [x] WispyText component (Skia)
- [x] Onboarding flow (3 screens)
- [x] Expo Router navigation shell + tab navigator
- [x] Google Fonts (Cormorant Garamond + DM Sans)
- [ ] Git init + GitHub repo (next step)
