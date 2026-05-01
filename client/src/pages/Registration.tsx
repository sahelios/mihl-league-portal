import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function Registration() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    team: "",
    registrationType: "individual",
    isFirstTime: false,
  });

  const teams = ["Iron Lions", "Golan Guards", "H Hammers", "Schvitz Saints"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit registration to API
    toast.success("Registration submitted! We'll review your application and contact you soon.");
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      team: "",
      registrationType: "individual",
      isFirstTime: false,
    });
  };

  const individualCost = 350;
  const teamCost = 6500;
  const jerseyCost = 80;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-12 text-foreground">Player Registration</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Registration Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Register for the 2026 Summer Season</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  {/* Contact Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>

                  {/* Team Selection */}
                  <div>
                    <Label htmlFor="team">Select Team *</Label>
                    <Select value={formData.team} onValueChange={(value) => setFormData({ ...formData, team: value })}>
                      <SelectTrigger id="team">
                        <SelectValue placeholder="Choose a team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team} value={team}>
                            {team}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Registration Type */}
                  <div>
                    <Label>Registration Type *</Label>
                    <div className="space-y-2 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="individual"
                          checked={formData.registrationType === "individual"}
                          onChange={(e) => setFormData({ ...formData, registrationType: e.target.value })}
                        />
                        <span className="text-foreground">Individual ($350)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="team"
                          checked={formData.registrationType === "team"}
                          onChange={(e) => setFormData({ ...formData, registrationType: e.target.value })}
                        />
                        <span className="text-foreground">Full Team ($6,500)</span>
                      </label>
                    </div>
                  </div>

                  {/* First Time Player */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="firstTime"
                      checked={formData.isFirstTime}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFirstTime: checked as boolean })}
                    />
                    <Label htmlFor="firstTime" className="cursor-pointer">
                      This is my first time playing in this league
                    </Label>
                  </div>

                  {formData.isFirstTime && (
                    <div className="bg-accent/10 border border-accent/30 rounded p-4">
                      <p className="text-sm text-foreground">
                        <strong>Note:</strong> First-time players must purchase a jersey and socks set for $80.
                      </p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    Submit Registration
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    * Required fields. Your registration will be reviewed and you'll receive an email confirmation.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-b border-border pb-4">
                  <p className="text-sm text-muted-foreground mb-1">Individual Registration</p>
                  <p className="text-2xl font-bold text-accent">${individualCost}</p>
                </div>

                <div className="border-b border-border pb-4">
                  <p className="text-sm text-muted-foreground mb-1">Full Team Registration</p>
                  <p className="text-2xl font-bold text-accent">${teamCost}</p>
                  <p className="text-xs text-muted-foreground mt-1">Up to 18 players</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Jersey & Socks Set</p>
                  <p className="text-2xl font-bold text-accent">${jerseyCost}</p>
                  <p className="text-xs text-muted-foreground mt-1">First-time players only</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Season Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Start Date</p>
                  <p className="font-semibold text-foreground">June 23, 2026</p>
                </div>
                <div>
                  <p className="text-muted-foreground">End Date</p>
                  <p className="font-semibold text-foreground">August 25, 2026</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-semibold text-foreground">10 weeks</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Venues</p>
                  <p className="font-semibold text-foreground">
                    Samuel Moscovitch Arena<br />
                    Outremont Arena
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
