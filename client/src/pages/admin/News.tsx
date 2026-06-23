import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Loader2, Trash2, Edit, Plus, Languages, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";

type NewsPost = {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  published: boolean;
};

export default function NewsManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [isEditing, setIsEditing] = useState<NewsPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State for Creation
  const [form, setForm] = useState({
    title: "",
    content: "",
    imageUrl: "",
    published: true,
  });

  // tRPC Hooks
  const utils = trpc.useUtils();
  const { data: newsPosts, isLoading } = trpc.admin.getNewsPosts.useQuery();

  const createMutation = trpc.admin.createNewsPost.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Post created!" : "Article créé !");
      setForm({ title: "", content: "", imageUrl: "", published: true });
      utils.admin.getNewsPosts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.admin.updateNewsPost.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Post updated!" : "Article mis à jour !");
      setIsEditing(null);
      utils.admin.getNewsPosts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.admin.deleteNewsPost.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Post deleted!" : "Article supprimé !");
      utils.admin.getNewsPosts.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // Admin Access Check[cite: 1, 2]
  if (user?.role !== 'admin') {
    navigate("/");
    return null;
  }

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
    if (window.confirm(language === "en" ? "Are you sure?" : "Êtes-vous sûr ?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-foreground">
              {language === "en" ? "News Management" : "Gestion des Nouvelles"}
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
            <Languages className="mr-2 h-4 w-4" />
            {language === "en" ? "Français" : "English"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Form Section */}
          <Card className="bg-card border-border h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {language === "en" ? "Create News Post" : "Créer un Article"}
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
                <div className="space-y-2">
                  <Label htmlFor="content">{language === "en" ? "Content" : "Contenu"}</Label>
                  <Textarea 
                    id="content" 
                    required 
                    rows={5}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">{language === "en" ? "Image URL" : "URL de l'image"}</Label>
                  <Input 
                    id="imageUrl" 
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="published" 
                    checked={form.published}
                    onCheckedChange={(checked) => setForm({ ...form, published: !!checked })}
                  />
                  <Label htmlFor="published">{language === "en" ? "Publish Immediately" : "Publier immédiatement"}</Label>
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : (language === "en" ? "Post News" : "Publier")}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* List Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {language === "en" ? "Recent Posts" : "Articles Récents"}
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {newsPosts?.map((post) => (
                  <Card key={post.id} className="bg-card border-border overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {post.imageUrl && (
                        <div className="w-full md:w-32 h-32 flex-shrink-0">
                          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4 flex-grow">
                        <div className="flex justify-between items-start">
                          <h3 className="font-bold text-foreground">{post.title}</h3>
                          {!post.published && (
                            <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded uppercase">
                              {language === "en" ? "Draft" : "Brouillon"}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {post.content}
                        </p>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(post)}>
                            <Edit className="h-3.5 w-3.5 mr-1" />
                            {language === "en" ? "Edit" : "Modifier"}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(post.id)}>
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            {language === "en" ? "Delete" : "Supprimer"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!isEditing} onOpenChange={(open) => !open && setIsEditing(null)}>
        <DialogContent className="sm:max-w-[525px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>{language === "en" ? "Edit News Post" : "Modifier l'article"}</DialogTitle>
          </DialogHeader>
          {isEditing && (
            <form onSubmit={handleUpdate} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>{language === "en" ? "Title" : "Titre"}</Label>
                <Input 
                  value={isEditing.title}
                  onChange={(e) => setIsEditing({ ...isEditing, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "en" ? "Content" : "Contenu"}</Label>
                <Textarea 
                  rows={6}
                  value={isEditing.content}
                  onChange={(e) => setIsEditing({ ...isEditing, content: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === "en" ? "Image URL" : "URL de l'image"}</Label>
                <Input 
                  value={isEditing.imageUrl || ""}
                  onChange={(e) => setIsEditing({ ...isEditing, imageUrl: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-published" 
                  checked={isEditing.published}
                  onCheckedChange={(checked) => setIsEditing({ ...isEditing, published: !!checked })}
                />
                <Label htmlFor="edit-published">{language === "en" ? "Published" : "Publié"}</Label>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsEditing(null)}>
                  {language === "en" ? "Cancel" : "Annuler"}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : (language === "en" ? "Save Changes" : "Enregistrer")}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}