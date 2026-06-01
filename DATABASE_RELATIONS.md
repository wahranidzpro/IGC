# Relations Base de Données — Infinity Gym Center

## Tables (10 migrations)

### `gym_users`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `auth_user_id` | UUID | FK → `auth.users(id)` (Supabase Auth) |
| `username` | TEXT | UNIQUE, NOT NULL |
| `password_hash` | TEXT | NOT NULL |
| `pin` | TEXT | UNIQUE |
| `role` | TEXT | NOT NULL — `admin`/`reception`/`coach`/`adherent` |
| `name` | TEXT | |
| `phone` | TEXT | |
| `club_id` | UUID | FK → `clubs(id)` |
| `is_locked` | BOOLEAN | DEFAULT false |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |

### `clubs`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `name` | TEXT | NOT NULL |
| `address` | TEXT | |
| `phone` | TEXT | |
| `email` | TEXT | |
| `capacity` | INTEGER | |
| `created_at` | TIMESTAMPTZ | DEFAULT now() |

### `profiles`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK, FK → `auth.users(id)` |
| `email` | TEXT | |
| `full_name` | TEXT | |
| `avatar_url` | TEXT | |
| `role` | INTEGER | NOT NULL — 10=member, 40=coach, 60=staff, 100=admin |
| `club_id` | UUID | FK → `clubs(id)` |
| `created_at` | TIMESTAMPTZ | |

### `members`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `club_id` | UUID | FK → `clubs(id)` |
| `user_id` | UUID | FK → `gym_users(id)` |
| `first_name` | TEXT | |
| `last_name` | TEXT | |
| `phone` | TEXT | |
| `email` | TEXT | |
| `birth_date` | DATE | |
| `gender` | TEXT | |
| `photo` | TEXT | |
| `membership_type` | TEXT | |
| `status` | TEXT | `active`/`inactive`/`expired` |
| `sessions_left` | INTEGER | |
| `fidelity_points` | INTEGER | |
| `coach_id` | UUID | FK → `gym_users(id)` |
| `created_at` | TIMESTAMPTZ | |

### `member_coaches`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `member_id` | UUID | FK → `members(id)` |
| `coach_id` | UUID | FK → `gym_users(id)` |
| `assigned_at` | TIMESTAMPTZ | |

### `checkins`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `member_id` | UUID | FK → `members(id)` |
| `club_id` | UUID | FK → `clubs(id)` |
| `checkin_time` | TIMESTAMPTZ | |
| `checkout_time` | TIMESTAMPTZ | |
| `method` | TEXT | `qr`/`rfid`/`pin`/`manual` |

### `payments`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `member_id` | UUID | FK → `members(id)` |
| `amount` | DECIMAL | |
| `type` | TEXT | `subscription`/`product`/`coaching`/`event` |
| `mode` | TEXT | `cash`/`card`/`wallet`/`points` |
| `payment_date` | TIMESTAMPTZ | |
| `description` | TEXT | |

### `workout_programs`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `member_id` | UUID | FK → `members(id)` |
| `coach_id` | UUID | FK → `gym_users(id)` |
| `name` | TEXT | |
| `exercises` | JSONB | `[{name, sets, reps, weight, rest, notes}]` |
| `start_date` | DATE | |
| `end_date` | DATE | |
| `status` | TEXT | `active`/`completed`/`cancelled` |

### `nutrition_programs`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `member_id` | UUID | FK → `members(id)` |
| `coach_id` | UUID | FK → `gym_users(id)` |
| `name` | TEXT | |
| `meals` | JSONB | `[{meal_type, foods: [{name, portion, calories}]}]` |
| `start_date` | DATE | |
| `end_date` | DATE | |
| `status` | TEXT | `active`/`completed`/`cancelled` |

### `progress_logs`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `member_id` | UUID | FK → `members(id)` |
| `coach_id` | UUID | FK → `gym_users(id)` |
| `weight` | DECIMAL | |
| `body_fat` | DECIMAL | |
| `muscle_mass` | DECIMAL | |
| `waist` | DECIMAL | |
| `notes` | TEXT | |
| `measured_at` | TIMESTAMPTZ | |

### `messages`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `sender_id` | UUID | FK → `gym_users(id)` |
| `receiver_id` | UUID | FK → `gym_users(id)` |
| `content` | TEXT | |
| `read_at` | TIMESTAMPTZ | |
| `created_at` | TIMESTAMPTZ | |

### `schedules`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `coach_id` | UUID | FK → `gym_users(id)` |
| `member_id` | UUID | FK → `members(id)` |
| `title` | TEXT | |
| `type` | TEXT | `coaching`/`class`/`appointment` |
| `start_time` | TIMESTAMPTZ | |
| `end_time` | TIMESTAMPTZ | |
| `status` | TEXT | `scheduled`/`completed`/`cancelled` |

### `notifications`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `gym_users(id)` |
| `title` | TEXT | |
| `content` | TEXT | |
| `type` | TEXT | |
| `read` | BOOLEAN | |
| `created_at` | TIMESTAMPTZ | |

### `rfid_tags`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `member_id` | UUID | FK → `members(id)` |
| `tag_uid` | TEXT | UNIQUE |
| `active` | BOOLEAN | |
| `issued_at` | TIMESTAMPTZ | |

### `products`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `club_id` | UUID | FK → `clubs(id)` |
| `name` | TEXT | |
| `barcode` | TEXT | |
| `buy_price` | DECIMAL | |
| `sell_price` | DECIMAL | |
| `stock` | INTEGER | |
| `category` | TEXT | |

### `sales`
| Colonne | Type | Contraintes |
|---------|------|-------------|
| `id` | UUID | PK |
| `product_id` | UUID | FK → `products(id)` |
| `member_id` | UUID | FK → `members(id)` |
| `quantity` | INTEGER | |
| `total` | DECIMAL | |
| `sale_date` | TIMESTAMPTZ | |

## Relations Clés

```
auth.users (Supabase Auth)
    ↑ auth_user_id
gym_users
    ├── role         → Contrôle d'accès RBAC
    ├── club_id      → clubs(id)
    ├── id           → members(user_id)
    ├── id           → member_coaches(coach_id)
    ├── id           → workout_programs(coach_id)
    ├── id           → nutrition_programs(coach_id)
    ├── id           → progress_logs(coach_id)
    ├── id           → schedules(coach_id)
    ├── id           → messages(sender_id)
    ├── id           → messages(receiver_id)
    └── id           → notifications(user_id)

clubs
    ├── id → members(club_id)
    └── id → products(club_id)

members
    ├── id → checkins(member_id)
    ├── id → payments(member_id)
    ├── id → member_coaches(member_id)
    ├── id → workout_programs(member_id)
    ├── id → nutrition_programs(member_id)
    ├── id → progress_logs(member_id)
    ├── id → schedules(member_id)
    ├── id → rfid_tags(member_id)
    ├── id → sales(member_id)
    └── coach_id → gym_users(id)
```

## Flux Auth (Supabase SSR)

1. Utilisateur se connecte → `POST /api/auth/login` ou `login/page.tsx`
2. `@supabase/ssr` crée la session dans les cookies
3. Middleware (`/middleware.ts`) vérifie la session et le rôle via `supabase.auth.getUser()`
4. `user.user_metadata.role` détermine les accès
5. Routes protégées dans `config.matcher`
