import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LeagueRules() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <h1 className="text-4xl font-bold mb-12 text-foreground">League Rules</h1>

        <div className="max-w-4xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Rules & Regulations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground/80">
              <section>
                <h3 className="font-semibold text-foreground mb-2">1. Game Duration</h3>
                <p>Each game consists of three 20-minute periods with a 15-minute intermission between periods. Games may be shortened at the discretion of league management.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">2. Roster Requirements</h3>
                <p>Each team must have a minimum of 12 players on their roster and a maximum of 18 players. A minimum of 10 players must be present to start a game.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">3. Player Eligibility</h3>
                <p>All players must be registered with the league and approved by league management before participating in games. Players must be at least 18 years old.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">4. Equipment Requirements</h3>
                <p>All players must wear approved hockey jerseys, helmets with face masks, gloves, and shin guards. Goaltenders must wear full protective equipment including chest protector and goalie pads.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">5. Scoring</h3>
                <p>Win = 2 points, Tie = 1 point, Loss = 0 points. Bonus points may be awarded for specific achievements as determined by league management.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">6. Penalties & Suspensions</h3>
                <p>Players who accumulate excessive penalties or engage in unsportsmanlike conduct may be suspended. Suspension length is determined by league management based on the severity of the infraction.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">7. Playoff Format</h3>
                <p>The top teams at the end of the regular season will qualify for playoffs. Playoff format and seeding will be determined by league management.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">8. Code of Conduct</h3>
                <p>All players must conduct themselves professionally and respectfully. Harassment, discrimination, or violence will not be tolerated and may result in suspension or expulsion from the league.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">9. Venue & Schedule</h3>
                <p>Games are held at Samuel Moscovitch Arena on Tuesdays (9:30 PM - 11:00 PM) and Outremont Arena on Thursdays (10:00 PM - 11:20 PM). Schedule changes must be approved by league management.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">10. Disputes & Appeals</h3>
                <p>Any disputes regarding game results or league decisions should be submitted in writing to league management within 48 hours of the incident. League management will review and make a final determination.</p>
              </section>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration & Fees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-foreground/80">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Individual Registration</h3>
                  <p className="text-2xl font-bold text-accent mb-2">$350</p>
                  <p className="text-sm">Per player for the full season (10 weeks)</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Team Registration</h3>
                  <p className="text-2xl font-bold text-accent mb-2">$6,500</p>
                  <p className="text-sm">For a full team (up to 18 players)</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Jersey & Socks Set</h3>
                  <p className="text-2xl font-bold text-accent mb-2">$80</p>
                  <p className="text-sm">Required for first-time players</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
