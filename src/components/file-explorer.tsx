"use client";
import { CopyCheckIcon, CopyIcon, DownloadIcon, ArchiveIcon, FolderIcon, FileCodeIcon, SearchIcon, ChevronRightIcon, LaptopIcon, PanelLeftCloseIcon, PanelLeftOpenIcon, MenuIcon } from "lucide-react";
import { useState, useMemo, useCallback, Fragment, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CodeView } from "./code-view";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  BreadcrumbPage,
} from "./ui/breadcrumb";
import { TreeView, TreeItem } from "./tree-view";
import { downloadProjectAsZip, downloadSingleFile } from "@/lib/download";
import { toast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type FileCollection = { [path: string]: string };

// extract file extension
function getLanguageFromExtension(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case 'tsx': return 'tsx';
    case 'ts': return 'typescript';
    case 'jsx': return 'jsx';
    case 'js': return 'javascript';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'html': return 'markup';
    default: return 'text';
  }
}

// Breadcrumb component
interface FileBreadcrumbProps {
  filepath: string;
}

const FileBreadcrumb = ({ filepath }: FileBreadcrumbProps) => {
  const pathSegments = filepath.split("/");

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/[0.06] rounded-full overflow-x-auto scrollbar-hide shrink-0 max-w-full">
      {pathSegments.map((seg, i) => {
        const isLast = i === pathSegments.length - 1;
        return (
          <Fragment key={i}>
            <span className={cn(
              "text-[10px] font-mono tracking-wide",
              isLast ? "text-blue-400 font-bold" : "text-gray-500"
            )}>
              {seg}
            </span>
            {!isLast && <ChevronRightIcon size={10} className="text-gray-700" />}
          </Fragment>
        );
      })}
    </div>
  );
};

// Convert flat file list to TreeItem[]
function convertFilesToTreeItems(files: FileCollection): TreeItem[] {
  const tree: Record<string, any> = {};
  Object.keys(files).forEach((path) => {
    const parts = path.split("/");
    let curr = tree;
    parts.forEach((part, idx) => {
      if (!curr[part]) {
        curr[part] = {
          label: part,
          children: {},
          isLeaf: idx === parts.length - 1,
          value: idx === parts.length - 1 ? path : undefined,
        };
      }
      curr = curr[part].children;
    });
  });

  function toArray(node: Record<string, any>): TreeItem[] {
    return Object.values(node).map((n) => ({
      label: n.label,
      value: n.isLeaf ? n.value : undefined,
      children: n.isLeaf ? undefined : toArray(n.children),
    }));
  }

  return toArray(tree).sort((a, b) => {
    // Directories first
    if (a.children && !b.children) return -1;
    if (!a.children && b.children) return 1;
    return a.label.localeCompare(b.label);
  });
}

interface FileExplorerProps {
  files: FileCollection;
  projectName?: string;
  selectedFile: string | null;
  onSelect: (filePath: string) => void;
}

export const FileExplorer = ({
  files,
  projectName = "project",
  selectedFile,
  onSelect
}: FileExplorerProps) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768 && selectedFile) {
      setIsSidebarOpen(false);
    }
  }, [selectedFile]);

  // Close sidebar on file select only on mobile
  const handleFileSelect = useCallback((path: string) => {
    onSelect(path);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, [onSelect]);

  const treeData = useMemo(() => convertFilesToTreeItems(files), [files]);

  const handleDownloadAll = useCallback(async () => {
    try {
      await downloadProjectAsZip(projectName, files);
      toast.success(`Downloading ${projectName} as zip`);
    } catch (error) {
      console.error(error);
      toast.error("Download failed", "Could not create zip. Please try again.");
    }
  }, [files, projectName]);

  return (
    <div className="flex flex-row w-full h-full bg-[#080808] overflow-hidden relative">
      
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="md:hidden absolute inset-0 bg-black/60 z-10 backdrop-blur-sm transition-opacity" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Dynamic Sidebar - File Tree */}
      <div className={cn(
        "shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0c0c0c]/95 backdrop-blur-xl z-20 transition-all duration-300 absolute md:relative h-full w-[260px] md:w-64 shadow-2xl md:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 hidden md:flex"
      )}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderIcon size={16} className="text-blue-500 fill-blue-500/20" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate">Explorer</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden p-1.5 hover:bg-white/5 rounded-md transition-colors text-gray-500 hover:text-white"
              title="Close Sidebar"
            >
              <PanelLeftCloseIcon size={14} />
            </button>
            <button
              onClick={handleDownloadAll}
              className="p-1.5 hover:bg-white/5 rounded-md transition-colors text-gray-500 hover:text-white"
              title="Download Project"
            >
              <ArchiveIcon size={14} />
            </button>
          </div>
        </div>

        {/* Project Context */}
        <div className="px-4 py-3 pb-1">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] rounded-lg border border-white/[0.08]">
            <LaptopIcon size={14} className="text-blue-400" />
            <span className="text-xs font-medium text-gray-300 truncate">{projectName}</span>
          </div>
        </div>

        {/* Tree Content */}
        <div className="flex-1 overflow-auto py-4 custom-scrollbar">
          <TreeView
            data={treeData}
            value={selectedFile}
            onSelect={handleFileSelect}
          />
        </div>
      </div>

      {/* Main Content Area - Editor */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#080808] relative w-full overflow-hidden">
        <AnimatePresence mode="wait">
          {selectedFile && files[selectedFile] ? (
            <motion.div
              key={selectedFile}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* File Sub-header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.03] bg-white/[0.01]">
                <div className="flex items-center gap-2 overflow-hidden">
                  {!isSidebarOpen && (
                    <button
                      onClick={() => setIsSidebarOpen(true)}
                      className="md:hidden p-1 mr-1 hover:bg-white/5 rounded-md text-gray-400 hover:text-white transition-colors shrink-0"
                      title="Open Explorer"
                    >
                      <MenuIcon size={16} />
                    </button>
                  )}
                  <FileBreadcrumb filepath={selectedFile} />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-600">
                    {(files[selectedFile].length / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>

              {/* Enhanced Code View */}
              <div className="flex-1 min-h-0">
                <CodeView
                  lang={getLanguageFromExtension(selectedFile)}
                  code={files[selectedFile]}
                  filename={selectedFile.split('/').pop()}
                />
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-4">
              <div className="size-20 rounded-full bg-white/[0.02] border border-white/[0.04] flex items-center justify-center animate-pulse">
                <FileCodeIcon size={32} />
              </div>
              <p className="text-sm font-medium tracking-wide">Select a source file to start analyzing</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
