import { LoginForm } from "@/components/login-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background">
      <div className="w-full max-w-md px-4">
        <div className="mb-8 text-center space-y-2">
          <div className="inline-block p-2 bg-primary/10 rounded-xl mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-10 w-10 text-primary"
            >
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path>
              <path d="M13 5v2"></path>
              <path d="M13 17v2"></path>
              <path d="M13 11v2"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Leoni Task Management
          </h1>
          <p className="text-muted-foreground">
            Sign in to your account to manage tasks and track performance
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
