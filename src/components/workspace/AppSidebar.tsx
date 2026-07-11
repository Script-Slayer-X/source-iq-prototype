import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Home,
  FolderKanban,
  Sparkles,
  Settings,
  LogOut,
  Plus,
} from "lucide-react";
import { listProjects } from "@/lib/workspace.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const listProjectsFn = useServerFn(listProjects);
  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => listProjectsFn(),
  });

  const isActive = (p: string) =>
    p === "/app" ? pathname === "/app" : pathname.startsWith(p);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/app" className="flex items-center gap-2 px-2 py-2">
          <span
            aria-hidden
            className="size-5 shrink-0 rounded bg-accent blur-[2px] opacity-80"
          />
          <span className="truncate font-display text-lg italic">
            SourceIQ
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/app")}>
                  <Link to="/app" className="flex items-center gap-2">
                    <Home className="size-4" />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.25em]">
            Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {(projects ?? []).slice(0, 8).map((p) => (
                <SidebarMenuItem key={p.id}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.includes(`/projects/${p.id}`)}
                  >
                    <Link
                      to="/app/projects/$projectId"
                      params={{ projectId: p.id }}
                      className="flex items-center gap-2"
                    >
                      <FolderKanban className="size-4" />
                      <span className="truncate">{p.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/app" className="flex items-center gap-2 text-muted-foreground">
                    <Plus className="size-4" />
                    <span>New project</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/app/settings")}>
              <Link to="/app/settings" className="flex items-center gap-2">
                <Settings className="size-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut}>
              <LogOut className="size-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-3 pb-2 pt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
          <Sparkles className="mr-1 inline size-3" />
          Powered by Lovable AI
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
