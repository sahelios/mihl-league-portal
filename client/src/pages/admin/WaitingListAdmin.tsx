import { ArrowLeft, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";

const labels = {
  en: {
    waitingList: "Waiting List",
    season: "Season",
    selectSeason: "Select a season",
    position: "Position",
    playerName: "Player Name",
    email: "Email",
    joinedDate: "Joined Date",
    actions: "Actions",
    promote: "Promote",
    remove: "Remove",
    noPlayers: "No players on waiting list",
    promoting: "Promoting...",
    removing: "Removing...",
    promoted: "Player promoted successfully",
    removed: "Player removed successfully",
    error: "Error",
  },
  fr: {
    waitingList: "Liste d'attente",
    season: "Saison",
    selectSeason: "Sélectionner une saison",
    position: "Position",
    playerName: "Nom du joueur",
    email: "Email",
    joinedDate: "Date d'adhésion",
    actions: "Actions",
    promote: "Promouvoir",
    remove: "Supprimer",
    noPlayers: "Aucun joueur sur la liste d'attente",
    promoting: "Promotion en cours...",
    removing: "Suppression en cours...",
    promoted: "Joueur promu avec succès",
    removed: "Joueur supprimé avec succès",
    error: "Erreur",
  },
};

export default function WaitingListAdmin() {
  const [, navigate] = useLocation();
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const t = labels[language];
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
  const [promotingId, setPromotingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");

  const { data: seasons } = trpc.admin.getSeasons.useQuery();
  const { data: waitingList, refetch } = trpc.admin.getWaitingList.useQuery(
    { seasonId: selectedSeasonId || 0 },
    { enabled: !!selectedSeasonId }
  );

  const promoteFromWaitingListMutation = trpc.admin.promoteFromWaitingList.useMutation({
    onSuccess: () => {
      refetch();
      setPromotingId(null);
      setMessage(t.promoted);
      setTimeout(() => setMessage(""), 3000);
    },
    onError: () => {
      setPromotingId(null);
      setMessage(t.error);
    },
  });

  const removeFromWaitingListMutation = trpc.admin.removeFromWaitingList.useMutation({
    onSuccess: () => {
      refetch();
      setRemovingId(null);
      setMessage(t.removed);
      setTimeout(() => setMessage(""), 3000);
    },
    onError: () => {
      setRemovingId(null);
      setMessage(t.error);
    },
  });

  const handlePromote = async (waitingListId: number) => {
    if (!selectedSeasonId) return;
    setPromotingId(waitingListId);
    try {
      await promoteFromWaitingListMutation.mutateAsync({
        waitingListId,
        seasonId: selectedSeasonId,
      });
    } catch (error) {
      console.error("Error promoting player:", error);
      setPromotingId(null);
    }
  };

  const handleRemove = async (waitingListId: number) => {
    setRemovingId(waitingListId);
    try {
      await removeFromWaitingListMutation.mutateAsync({ waitingListId });
    } catch (error) {
      console.error("Error removing player:", error);
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-lg ${
          message === t.error
            ? "bg-red-100 text-red-800"
            : "bg-green-100 text-green-800"
        }`}>
          {message}
        </div>
      )}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t.waitingList}</h1>
          <p className="text-gray-600 mt-2">Manage players on the waiting list</p>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => setLanguage("en")}
            className={`px-3 py-1 rounded ${
              language === "en"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("fr")}
            className={`px-3 py-1 rounded ${
              language === "fr"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            FR
          </button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.selectSeason}</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedSeasonId?.toString() || ""}
            onValueChange={(val) => setSelectedSeasonId(parseInt(val))}
          >
            <SelectTrigger>
              <SelectValue placeholder={t.selectSeason} />
            </SelectTrigger>
            <SelectContent>
              {seasons?.map((season: any) => (
                <SelectItem key={season.id} value={season.id.toString()}>
                  {season.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedSeasonId && (
        <Card>
          <CardHeader>
            <CardTitle>{t.waitingList}</CardTitle>
          </CardHeader>
          <CardContent>
            {!waitingList || waitingList.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-gray-500">
                <AlertCircle className="mr-2" />
                {t.noPlayers}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">{t.position}</th>
                      <th className="text-left py-2 px-4">{t.playerName}</th>
                      <th className="text-left py-2 px-4">{t.email}</th>
                      <th className="text-left py-2 px-4">{t.joinedDate}</th>
                      <th className="text-left py-2 px-4">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitingList.map((entry: any, index: number) => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{index + 1}</td>
                        <td className="py-3 px-4">
                          {entry.firstName} {entry.lastName}
                        </td>
                        <td className="py-3 px-4">{entry.email}</td>
                        <td className="py-3 px-4">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 space-x-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handlePromote(entry.id)}
                            disabled={promotingId === entry.id}
                          >
                            {promotingId === entry.id ? t.promoting : t.promote}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleRemove(entry.id)}
                            disabled={removingId === entry.id}
                          >
                            {removingId === entry.id ? t.removing : t.remove}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
