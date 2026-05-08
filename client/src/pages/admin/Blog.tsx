import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Loader2, Trash2, Edit, Plus, Languages, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// Types
type BlogPost = {
  id: number;
  title: string;
  author: string;
  content: string;
  imageUrl?: string;
  category: string;
  published: boolean;
  publishDate: string;
};

type TabType = "all" | "published" | "draft";

export default function BlogManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  
  // List State
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit/Submit State
  const [isEditing, setIsEditing] = useState<BlogPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const defaultFormState = {
    title: "",
    author: user?.name || "",
    content: "",
    imageUrl: "",
    category: "news",
    published: true,
    publishDate: new Date().toISOString().split("T")[0],
  };
  const [form, setForm] = useState(defaultFormState);

  // Auto-fill author when user loads
  useEffect(() => {
    if (user?.name && !form.author) {
      setForm((prev) => ({ ...prev, author: user.name }));
    }
  }, [user]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, activeTab]);

  // tRPC Hooks
  const utils = trpc.useUtils();
  const { data: blogPosts, isLoading } = trpc.admin.getBlogPosts.useQuery();

  const createMutation = trpc.admin.createBlogPost.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Blog post created!" : "Article de blog créé !");
      setForm({ ...defaultFormState, author: user?.name || "" });
      utils.admin.getBlogPosts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.updateBlogPost.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Blog post updated!" : "Article mis à jour !");
      setIsEditing(null);
      utils.admin.getBlogPosts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteBlogPost.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Blog post deleted!" : "Article supprimé !");
      utils.admin.getBlogPosts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Check admin access
  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  // Derived & Filtered Data
  const filteredPosts = useMemo(() => {
    if (!blogPosts) return [];
    
    let filtered = [...blogPosts];

    // Tab Filter
    if (activeTab === "published") filtered = filtered.filter((p) => p.published);
    if (activeTab === "draft") filtered = filtered.filter((p) => !p.published);

    // Category Filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    // Search Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.title.toLowerCase().includes(q));
    }

    // Sort Newest First
    filtered.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    return filtered;
  }, [blogPosts, activeTab, categoryFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handlers
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setIsSubmitting(true);
    await createMutation.mutateAsync(form);
    setIsSubmitting(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    setIsSubmitting(true);
    await updateMutation.mutateAsync(isEditing);
    setIsSubmitting(false);
  };

  const handleDelete = (id: number) => {
    if (window.confirm(language === "en" ? "Are you sure you want to delete this post?" : "Êtes-vous sûr de vouloir supprimer cet article ?")) {
      deleteMutation.mutate({ id });
    }
  };

  // UI Helpers
  const categories = [
    { value: "news", en: "News", fr: "Nouvelles" },
    { value: "tips", en: "Tips", fr: "Conseils" },
    { value: "updates", en: "Updates", fr: "Mises à jour" },
    { value: "other", en: "Other", fr: "Autre" },
  ];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-foreground">
            {language === "en" ? "Blog Management" : "Gestion du Blog"}
          </h1>
          <Button variant="ghost" size="sm" onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
            <Languages className="mr-2 h-4 w-4" />
            {language === "en" ? "Français" : "English"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Create Form Section (1/3 width on desktop) */}
          <Card className="bg-card border-border sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {language === "en" ? "Create Blog Post" : "Créer un Article"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{language === "en" ? "Title" : "Titre"}</Label>
                  <Input 
                    id="title" 
                    required 
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">{language === "en" ? "Author" : "Auteur"}</Label>
                    <Input 
                      id="author" 
                      required 
                      value={form.author}
                      onChange={(e) => setForm({ ...form, author: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="publishDate">{language === "en" ? "Publish Date" : "Date de publication"}</Label>
                    <Input 
                      id="publishDate" 
                      type="date"
                      required 
                      value={form.publishDate}
                      onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">{language === "en" ? "Category" : "Catégorie"}</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.value} value={c.value}>
                          {language === "en" ? c.en : c.fr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">{language === "en" ? "Content (Markdown allowed)" : "Contenu (Markdown autorisé)"}</Label>
                  <Textarea 
                    id="content" 
                    required 
                    rows={8}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">{language === "en" ? "Featured Image URL" : "URL de l'image à la une"}</Label>
                  <Input 
                    id="imageUrl" 
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2 pb-4">
                  <Checkbox 
                    id="published" 
                    checked={form.published}
                    onCheckedChange={(checked) => setForm({ ...form, published: !!checked })}
                  />
                  <Label htmlFor="published" className="font-medium cursor-pointer">
                    {language === "en" ? "Publish Immediately" : "Publier immédiatement"}
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  {language === "en" ? "Save Post" : "Enregistrer l'article"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List Section (2/3 width on desktop) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Filters & Tabs */}
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-4">
                {/* Tabs */}
                <div className="flex space-x-2 border-b border-border pb-4 overflow-x-auto">
                  <Button 
                    variant={activeTab === "all" ? "default" : "ghost"} 
                    onClick={() => setActiveTab("all")}
                    className="rounded-full"
                  >
                    {language === "en" ? "All Posts" : "Tous les articles"}
                  </Button>
                  <Button 
                    variant={activeTab === "published" ? "default" : "ghost"} 
                    onClick={() => setActiveTab("published")}
                    className="rounded-full"
                  >
                    {language === "en" ? "Published" : "Publiés"}
                  </Button>
                  <Button 
                    variant={activeTab === "draft" ? "default" : "ghost"} 
                    onClick={() => setActiveTab("draft")}
                    className="rounded-full"
                  >
                    {language === "en" ? "Drafts" : "Brouillons"}
                  </Button>
                </div>

                {/* Search & Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder={language === "en" ? "Search by title..." : "Rechercher par titre..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="w-full sm:w-48 flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder={language === "en" ? "All Categories" : "Toutes les catégories"} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{language === "en" ? "All Categories" : "Toutes les catégories"}</SelectItem>
                        {categories.map(c => (
                          <SelectItem key={c.value} value={c.value}>
                            {language === "en" ? c.en : c.fr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table */}
            <Card className="bg-card border-border overflow-hidden">
              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
                ) : paginatedPosts.length === 0 ? (
                  <div className="text-center p-12 text-muted-foreground">
                    {language === "en" ? "No posts found." : "Aucun article trouvé."}
                  </div>
                ) : (
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-muted text-muted-foreground">
                      <tr>
                        <th className="px-6 py-3">{language === "en" ? "Title" : "Titre"}</th>
                        <th className="px-6 py-3">{language === "en" ? "Author" : "Auteur"}</th>
                        <th className="px-6 py-3">{language === "en" ? "Category" : "Catégorie"}</th>
                        <th className="px-6 py-3">{language === "en" ? "Status" : "Statut"}</th>
                        <th className="px-6 py-3">{language === "en" ? "Date" : "Date"}</th>
                        <th className="px-6 py-3 text-right">{language === "en" ? "Actions" : "Actions"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {paginatedPosts.map((post) => (
                        <tr key={post.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground max-w-[200px] truncate">
                            {post.title}
                          </td>
                          <td className="px-6 py-4">{post.author}</td>
                          <td className="px-6 py-4">
                            {categories.find(c => c.value === post.category)?.[language] || post.category}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={post.published ? "default" : "secondary"}>
                              {post.published 
                                ? (language === "en" ? "Published" : "Publié") 
                                : (language === "en" ? "Draft" : "Brouillon")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            {new Date(post.publishDate).toLocaleDateString(language === "en" ? 'en-CA' : 'fr-CA')}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                            <Button variant="outline" size="icon" onClick={() => setIsEditing(post)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(post.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              
              {/* Pagination Controls */}
              {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
                  <span className="text-sm text-muted-foreground">
                    {language === "en" ? "Page" : "Page"} {currentPage} {language === "en" ? "of" : "sur"} {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>

          </div>
        </div>
      </div>

      {/* Edit Post Dialog */}
      <Dialog open={!!isEditing} onOpenChange={(open) => !open && setIsEditing(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>{language === "en" ? "Edit Blog Post" : "Modifier l'article"}</DialogTitle>
          </DialogHeader>
          
          {isEditing && (
            <form onSubmit={handleUpdate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{language === "en" ? "Title" : "Titre"}</Label>
                <Input 
                  required
                  value={isEditing.title}
                  onChange={(e) => setIsEditing({ ...isEditing, title: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{language === "en" ? "Author" : "Auteur"}</Label>
                  <Input 
                    required
                    value={isEditing.author}
                    onChange={(e) => setIsEditing({ ...isEditing, author: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{language === "en" ? "Publish Date" : "Date de publication"}</Label>
                  <Input 
                    type="date"
                    required
                    value={isEditing.publishDate.split('T')[0]} // Ensure valid format
                    onChange={(e) => setIsEditing({ ...isEditing, publishDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>{language === "en" ? "Category" : "Catégorie"}</Label>
                <Select value={isEditing.category} onValueChange={(v) => setIsEditing({ ...isEditing, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.value} value={c.value}>
                        {language === "en" ? c.en : c.fr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{language === "en" ? "Content" : "Contenu"}</Label>
                <Textarea 
                  required
                  rows={8}
                  value={isEditing.content}
                  onChange={(e) => setIsEditing({ ...isEditing, content: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{language === "en" ? "Featured Image URL" : "URL de l'image à la une"}</Label>
                <Input 
                  value={isEditing.imageUrl || ""}
                  onChange={(e) => setIsEditing({ ...isEditing, imageUrl: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="edit-published" 
                  checked={isEditing.published}
                  onCheckedChange={(checked) => setIsEditing({ ...isEditing, published: !!checked })}
                />
                <Label htmlFor="edit-published" className="font-medium cursor-pointer">
                  {language === "en" ? "Published" : "Publié"}
                </Label>
              </div>
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(null)}>
                  {language === "en" ? "Cancel" : "Annuler"}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                  {language === "en" ? "Save Changes" : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}