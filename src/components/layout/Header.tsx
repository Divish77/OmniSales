import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8 
      glass border-x-0 border-t-0 bg-white/30 dark:bg-slate-950/30 backdrop-blur-2xl transition-all duration-300">
      
      <div className="flex items-center gap-4">
        <MobileMenu />
        
        <div className="hidden sm:flex items-center">
          <h1 className="text-xl font-bold sm:text-2xl text-slate-900 dark:text-white">
            Dashboard Overview
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block w-72">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <Input
            id="search"
            name="search"
            className="block w-full rounded-full border-0 bg-white/40 dark:bg-slate-800/40 py-2 pl-10 pr-3 text-sm placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 transition-all duration-300 shadow-sm backdrop-blur-sm"
            placeholder="Search analytics..."
            type="search"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-white/20">
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
            <Bell className="h-5 w-5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
          </Button>
          
          <img
            className="h-9 w-9 rounded-full border-2 border-white/50 shadow-sm ml-2 hidden sm:block"
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="User avatar"
          />
        </div>
      </div>
    </header>
  );
}
