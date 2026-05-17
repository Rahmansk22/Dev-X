import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarRail,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { ChevronRightIcon, FileIcon, FolderIcon, FolderOpenIcon, FileCode2Icon, FileJsonIcon, FileTypeIcon, FileTextIcon, FileEditIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface TreeItem {
  label: string;
  value?: string;
  children?: TreeItem[];
}

interface TreeViewProps {
  data: TreeItem[];
  value: string | null;
  onSelect: (value: string) => void;
}

export const TreeView = ({ data, value, onSelect }: TreeViewProps) => {
  return (
    <SidebarProvider>
      <Sidebar collapsible="none" className="w-full bg-transparent border-none overflow-hidden h-full">
        <SidebarContent className="p-2 pt-0 custom-scrollbar bg-transparent">
          <SidebarGroup className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-0.5">
                {data.map((item, index) => (
                  <Tree
                    key={index}
                    item={item}
                    selectedValue={value}
                    onSelect={onSelect}
                    parentPath=""
                    level={0}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
};

interface TreeProps {
  item: TreeItem;
  selectedValue: string | null;
  onSelect?: (value: string) => void;
  parentPath: string;
  level: number;
}

const Tree = ({ item, selectedValue, onSelect, parentPath, level }: TreeProps) => {
  const [isOpen, setIsOpen] = useState(level === 0);
  const currentPath = parentPath ? `${parentPath}/${item.label}` : item.label;
  const isSelected = selectedValue === currentPath;
  const hasChildren = item.children && item.children.length > 0;

  // Custom icons based on extension
  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx':
      case 'jsx': return <FileCode2Icon className="size-3.5 text-blue-400" />;
      case 'ts':
      case 'js': return <FileCode2Icon className="size-3.5 text-amber-400" />;
      case 'json': return <FileJsonIcon className="size-3.5 text-green-400" />;
      case 'css': return <FileTypeIcon className="size-3.5 text-pink-400" />;
      default: return <FileTextIcon className="size-3.5 text-gray-500" />;
    }
  };

  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={isSelected}
          className={cn(
            "group relative w-full h-8 flex items-center gap-2 px-3 rounded-md transition-all duration-200",
            isSelected
              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm"
              : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.03] border border-transparent"
          )}
          onClick={() => onSelect?.(currentPath)}
        >
          <div className="flex items-center gap-2.5 w-full">
            {getFileIcon(item.label)}
            <span className="truncate text-[11px] font-medium font-mono">
              {item.label}
            </span>
          </div>
          {isSelected && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-500 rounded-full" />
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "group w-full h-8 flex items-center gap-2 px-3 rounded-md transition-all",
              "text-gray-400 hover:text-gray-200 hover:bg-white/[0.03]"
            )}
          >
            <div className="flex items-center gap-2 w-full">
              <ChevronRightIcon
                size={12}
                className={cn(
                  "transition-transform duration-200",
                  isOpen ? "rotate-90 text-blue-400" : "text-gray-600"
                )}
              />
              {isOpen ? (
                <FolderOpenIcon size={14} className="text-blue-500/60" />
              ) : (
                <FolderIcon size={14} className="text-gray-600" />
              )}
              <span className="truncate text-[11px] font-bold uppercase tracking-tight opacity-80">
                {item.label}
              </span>
            </div>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="relative ml-4 pl-2 border-l border-white/[0.05] mt-0.5 mb-1 gap-0.5">
            {item.children?.map((child, index) => (
              <Tree
                key={index}
                item={child}
                selectedValue={selectedValue}
                onSelect={onSelect}
                parentPath={currentPath}
                level={level + 1}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  );
};
