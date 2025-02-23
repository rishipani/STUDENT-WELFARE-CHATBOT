
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/lib/themes";

export function ThemeSwitcher() {
  const { mode, setMode } = useThemeStore();

  const toggleTheme = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(newMode);
    setMode(newMode);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme}>
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}
