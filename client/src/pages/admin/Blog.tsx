import { ArrowLeft, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Trash2, Edit, Plus, Languages } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

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

export default function BlogManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [isEditing, setIsEditing] = useState<BlogPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({ title: "", content: "", imageUrl: "", published: true });

  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  const utils = trpc.useUtils();
  const { data: posts, isLoading } = trpc.admin.getBlogPosts.useQuery();

  const createMutation = trpc.admin.createBlogPost.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Post created" : "Article créé");
      setForm({ title: "", content: "", imageUrl: "", published: true });
      utils.admin.getBlogPosts.invalidate();
      setIsSubmitting(false);
    },
  });

  const updateMutation = trpc.admin.updateBlogPost.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Post updated" : "Article mis à jour");
      setIsEditing(null);
      utils.admin.getBlogPosts.invalidate();
      setIsSubmitting(false);
    },
  });

  const deleteMutation = trpc.admin.deleteBlogPost.useMutation({
    onSuccess: () => {
      toast.success(language === "en" ? "Post deleted" : "Article supprimé");
      utils.admin.getBlogPosts.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    createMutation.mutate(form);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing) return;
    setIsSubmitting(true);
    updateMutation.mutate({
      id: isEditing.id,
      title: isEditing.title,
      content: isEditing.content,
      imageUrl: isEditing.imageUrl,
      published: isEditing.published,
    });
  };

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        <div>
          <h1 className="text-3xl font-bold">{language === "en" ? "Blog Management" : "Gestion du Blog"}</h1>
        </div>
        <Button variant="outline" onClick={() => setLanguage(language === "en" ? "fr" : "en")}>
          <Languages className="mr-2 h-4 w-4" />
          {language === "en" ? "Français" : "English"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {language === "en" ? "New Post" : "Nouvel Article"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>{language === "en" ? "Title" : "Titre"}</Label>
                  <Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === "en" ? "Content" : "Contenu"}</Label>
                  <Textarea required rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{language === "en" ? "Image URL" : "URL de l'image"}</Label>
                  <Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : (language === "en" ? "Publish Post" : "Publier l'article")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
          ) : (
            <div className="space-y-4">
              {posts?.map((post) => (
                <Card key={post.id}>
                  <CardContent className="flex justify-between items-start p-6">
                    <div>
                      <h3 className="font-bold text-lg">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="icon" onClick={() => setIsEditing(post as BlogPost)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate({ id: post.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!isEditing} onOpenChange={(open) => !open && setIsEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === "en" ? "Edit Post" : "Modifier l'article"}</DialogTitle>
          </DialogHeader>
          {isEditing && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{language === "en" ? "Title" : "Titre"}</Label>
                <Input required value={isEditing.title} onChange={(e) => setIsEditing({ ...isEditing, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{language === "en" ? "Content" : "Contenu"}</Label>
                <Textarea required rows={6} value={isEditing.content} onChange={(e) => setIsEditing({ ...isEditing, content: e.target.value })} />
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