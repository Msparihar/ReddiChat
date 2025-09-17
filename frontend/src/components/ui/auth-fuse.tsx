"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff, Bot } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import RedditCommunities from "./RedditCommunities";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({
  text,
  speed = 100,
  cursor = "|",
  loop = false,
  deleteSpeed = 50,
  delay = 1500,
  className,
}: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);

  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;

    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          if (currentIndex < currentText.length) {
            setDisplayText((prev) => prev + currentText[currentIndex]);
            setCurrentIndex((prev) => prev + 1);
          } else if (loop) {
            setTimeout(() => setIsDeleting(true), delay);
          }
        } else {
          if (displayText.length > 0) {
            setDisplayText((prev) => prev.slice(0, -1));
          } else {
            setIsDeleting(false);
            setCurrentIndex(0);
            setTextArrayIndex((prev) => (prev + 1) % textArray.length);
          }
        }
      },
      isDeleting ? deleteSpeed : speed,
    );

    return () => clearTimeout(timeout);
  }, [
    currentIndex,
    isDeleting,
    currentText,
    loop,
    speed,
    deleteSpeed,
    delay,
    displayText,
    text,
  ]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input dark:border-input/50 bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-foreground/60 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input dark:border-input/50 bg-background px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

function SignInForm() {
  const handleGoogleLogin = () => {
    // Get the API base URL from environment or use default
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    // Redirect to Google OAuth endpoint
    window.location.href = `${API_BASE_URL}/api/v1/auth/login/google`;
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Sign in to your account</h2>
        <p className="text-sm text-gray-400 mt-1">Continue with Google to get started</p>
      </div>
      <Button
        type="button"
        className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
        onClick={handleGoogleLogin}
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>
    </div>
  );
}

function SignUpForm() {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-white">Create an account</h2>
        <p className="text-sm text-gray-400 mt-1">Continue with Google to get started</p>
      </div>
      <Button
        type="button"
        className="w-full bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
        onClick={() => console.log("UI: Google button clicked")}
      >
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google icon" className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>
    </div>
  );
}

function AuthFormContainer() {
    return (
        <div className="bg-gray-900 rounded-2xl p-8 shadow-2xl border border-gray-800">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Bot size={32} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">ReddiChat</h1>
            </div>

            <div className="space-y-6">
                <SignInForm />
            </div>
        </div>
    )
}

interface AuthContentProps {
    image?: {
        src: string;
        alt: string;
    };
    quote?: {
        text: string;
        author: string;
    }
}

interface AuthUIProps {
    signInContent?: AuthContentProps;
    signUpContent?: AuthContentProps;
}

const defaultSignInContent = {
    image: {
        src: "/auth-background.png",
        alt: "ReddiChat auth background"
    },
    quote: {
        text: "Welcome Back! The journey continues.",
        author: "ReddiChat"
    }
};

const defaultSignUpContent = {
    image: {
        src: "/auth-background.png",
        alt: "ReddiChat auth background"
    },
    quote: {
        text: "Create an account. A new chapter awaits.",
        author: "ReddiChat"
    }
};

export function AuthUI() {
  return (
    <div className="w-full min-h-screen bg-gray-950 flex flex-col">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>

      {/* Centered login card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <AuthFormContainer />
        </div>
      </div>

      {/* Bottom section with Reddit communities message */}
      <div className="p-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-3">
            Join thousands of Reddit users who are already using ReddiChat
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Connect with top Reddit communities and start meaningful conversations
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
            <a href="https://reddit.com/r/AskReddit" target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors cursor-pointer">r/AskReddit</a>
            <a href="https://reddit.com/r/funny" target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors cursor-pointer">r/funny</a>
            <a href="https://reddit.com/r/gaming" target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors cursor-pointer">r/gaming</a>
            <a href="https://reddit.com/r/Music" target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors cursor-pointer">r/Music</a>
            <a href="https://reddit.com/r/pics" target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors cursor-pointer">r/pics</a>
            <a href="https://reddit.com/r/videos" target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors cursor-pointer">r/videos</a>
            <a href="https://reddit.com/r/memes" target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors cursor-pointer">r/memes</a>
            <a href="https://reddit.com/r/technology" target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors cursor-pointer">r/technology</a>
            <a href="https://www.reddit.com/explore/" target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors cursor-pointer">+ more</a>
          </div>
        </div>
      </div>
    </div>
  );
}
