# Database Schema — Glow Beauty App

PostgreSQL database for the full backend.

## ERD

```
users ──┬── scan_results ──┬── acne_detections
         │                  ├── skin_concerns
         │                  └── scan_product_matches ── products ──┬── product_ingredients
         │                                                          ├── product_shades
         │                                                          └── product_skin_concerns
         │
         ├── progress_entries ── scan_results (comparison)
         │
         ├── bookings ──┬── dermatologists
         │              └── scan_results (shared with doctor)
         │
         └── cart ── cart_items ──┬── products
                                  └── product_shades (optional)

orders ──── cart (checkout)
```

## Table Details

| # | Table | Purpose | Case |
|---|---|---|---|
| 1 | `users` | User accounts, skin profile, locale | All |
| 2 | `scan_results` | Skin analysis results with images & scores | 1, 4, 5 |
| 3 | `acne_detections` | Per-scan acne type breakdown | 1 |
| 4 | `skin_concerns` | Per-scan secondary concerns | 1 |
| 5 | `products` | Product catalog | 2, 3 |
| 6 | `product_ingredients` | Ingredient list with comedogenic flag | 3 |
| 7 | `product_shades` | AR try-on color variants | 2 |
| 8 | `product_skin_concerns` | Product ↔ concern mapping | 3 |
| 9 | `scan_product_matches` | AI-recommended products per scan | 3 |
| 10 | `progress_entries` | Week-over-week improvement tracking | 4 |
| 11 | `dermatologists` | Partnered doctor profiles | 5 |
| 12 | `bookings` | Doctor consultation bookings | 5 |
| 13 | `carts` | User shopping carts | 2 |
| 14 | `cart_items` | Items in cart | 2 |
| 15 | `orders` | Completed purchases | 2 |

## Key Indexes

- `scan_results(user_id, created_at DESC)` — timeline queries
- `progress_entries(user_id, week_number)` — progress lookups
- `scan_product_matches(scan_result_id, product_id)` — recommendations
- `products(category, is_comedogenic)` — filtering
- `bookings(dermatologist_id, status)` — availability
