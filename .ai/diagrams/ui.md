# Diagram Architektury UI - Moduł Autentykacji

## Diagram 1: Struktura Stron i Layouts

```mermaid
flowchart TD
    MW[Middleware] --> AUTH_PAGES
    MW --> PROTECTED_PAGES
    
    subgraph AUTH_PAGES["Strony Autentykacji"]
        LOGIN[login.astro]
        REGISTER[register.astro]
        FORGOT[forgot-password.astro]
        RESET[reset-password.astro]
    end
    
    subgraph PROTECTED_PAGES["Strony Chronione"]
        ACCOUNT[account.astro]
        CREATE[create.astro]
        FLASHCARDS[flashcards.astro]
        REVIEW[review.astro]
    end
    
    AUTH_LAYOUT[AuthLayout] --> LOGIN
    AUTH_LAYOUT --> REGISTER
    AUTH_LAYOUT --> FORGOT
    AUTH_LAYOUT --> RESET
    
    MAIN_LAYOUT[Layout + AppShell] --> ACCOUNT
    MAIN_LAYOUT --> CREATE
    MAIN_LAYOUT --> FLASHCARDS
    MAIN_LAYOUT --> REVIEW
    
    classDef auth fill:#e0f2fe,stroke:#0369a1,stroke-width:2px,color:#000
    classDef protected fill:#dcfce7,stroke:#16a34a,stroke-width:2px,color:#000
    classDef layout fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#000
    
    class LOGIN,REGISTER,FORGOT,RESET auth
    class ACCOUNT,CREATE,FLASHCARDS,REVIEW protected
    class AUTH_LAYOUT,MAIN_LAYOUT layout
```

## Diagram 2: Komponenty Autentykacji

```mermaid
flowchart LR
    subgraph PAGES["Strony"]
        P_LOGIN[login]
        P_REGISTER[register]
        P_FORGOT[forgot-password]
        P_RESET[reset-password]
        P_ACCOUNT[account]
    end
    
    subgraph COMPONENTS["Komponenty React"]
        AUTH_FORM[AuthForm]
        FORGOT_FORM[ForgotPasswordForm]
        RESET_FORM[ResetPasswordForm]
        CHANGE_FORM[ChangePasswordForm]
        DANGER_CARD[DangerZoneCard]
        PASSWORD_STRENGTH[PasswordStrength]
    end
    
    P_LOGIN --> AUTH_FORM
    P_REGISTER --> AUTH_FORM
    P_FORGOT --> FORGOT_FORM
    P_RESET --> RESET_FORM
    P_ACCOUNT --> CHANGE_FORM
    P_ACCOUNT --> DANGER_CARD
    
    AUTH_FORM --> PASSWORD_STRENGTH
    RESET_FORM --> PASSWORD_STRENGTH
    CHANGE_FORM --> PASSWORD_STRENGTH
    
    classDef page fill:#e0f2fe,stroke:#0369a1,stroke-width:2px,color:#000
    classDef component fill:#fce7f3,stroke:#db2777,stroke-width:2px,color:#000
    
    class P_LOGIN,P_REGISTER,P_FORGOT,P_RESET,P_ACCOUNT page
    class AUTH_FORM,FORGOT_FORM,RESET_FORM,CHANGE_FORM,DANGER_CARD,PASSWORD_STRENGTH component
```

## Diagram 3: Przepływ API i Backend

```mermaid
flowchart TD
    subgraph FORMS["Formularze"]
        F_AUTH[AuthForm]
        F_FORGOT[ForgotPasswordForm]
        F_RESET[ResetPasswordForm]
        F_CHANGE[ChangePasswordForm]
        F_DANGER[DangerZoneCard]
        F_TOPBAR[Topbar Logout]
    end
    
    subgraph API["API Endpoints"]
        API_LOGIN["POST /api/auth/login"]
        API_REGISTER["POST /api/auth/register"]
        API_LOGOUT["POST /api/auth/logout"]
        API_FORGOT["POST /api/auth/forgot-password"]
        API_RESET["POST /api/auth/reset-password"]
        API_CHANGE["POST /api/account/change-password"]
        API_DELETE["POST /api/account/delete"]
    end
    
    subgraph BACKEND["Backend"]
        SUPABASE[Supabase Auth]
        EMAIL[Email Service]
        DB[Database]
    end
    
    F_AUTH -->|POST login| API_LOGIN
    F_AUTH -->|POST register| API_REGISTER
    F_FORGOT --> API_FORGOT
    F_RESET --> API_RESET
    F_CHANGE --> API_CHANGE
    F_DANGER --> API_DELETE
    F_TOPBAR --> API_LOGOUT
    
    API_LOGIN --> SUPABASE
    API_REGISTER --> SUPABASE
    API_LOGOUT --> SUPABASE
    API_FORGOT --> EMAIL
    API_RESET --> SUPABASE
    API_CHANGE --> SUPABASE
    API_DELETE --> SUPABASE
    API_DELETE --> DB
    
    classDef form fill:#fce7f3,stroke:#db2777,stroke-width:2px,color:#000
    classDef api fill:#fed7aa,stroke:#c2410c,stroke-width:2px,color:#000
    classDef backend fill:#fee2e2,stroke:#dc2626,stroke-width:2px,color:#000
    
    class F_AUTH,F_FORGOT,F_RESET,F_CHANGE,F_DANGER,F_TOPBAR form
    class API_LOGIN,API_REGISTER,API_LOGOUT,API_FORGOT,API_RESET,API_CHANGE,API_DELETE api
    class SUPABASE,EMAIL,DB backend
```

## Diagram 4: Walidacja Zod

```mermaid
flowchart LR
    subgraph SCHEMAS["Schematy Walidacji"]
        LOGIN_SCHEMA[LoginSchema]
        REGISTER_SCHEMA[RegisterSchema]
        FORGOT_SCHEMA[ForgotPasswordSchema]
        RESET_SCHEMA[ResetPasswordSchema]
        CHANGE_SCHEMA[ChangePasswordSchema]
    end
    
    AUTH_FORM[AuthForm] --> LOGIN_SCHEMA
    AUTH_FORM --> REGISTER_SCHEMA
    FORGOT_FORM[ForgotPasswordForm] --> FORGOT_SCHEMA
    RESET_FORM[ResetPasswordForm] --> RESET_SCHEMA
    CHANGE_FORM[ChangePasswordForm] --> CHANGE_SCHEMA
    
    classDef component fill:#fce7f3,stroke:#db2777,stroke-width:2px,color:#000
    classDef schema fill:#ffedd5,stroke:#ea580c,stroke-width:2px,color:#000
    
    class AUTH_FORM,FORGOT_FORM,RESET_FORM,CHANGE_FORM component
    class LOGIN_SCHEMA,REGISTER_SCHEMA,FORGOT_SCHEMA,RESET_SCHEMA,CHANGE_SCHEMA schema
```
