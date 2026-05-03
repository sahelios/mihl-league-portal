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
                <h3 className="font-semibold text-foreground mb-2">1. Game Duration & Warm-up</h3>
                <p>Each game begins with a <strong>2:30 warm-up period</strong>. Games consist of three periods: the first two periods are <strong>23 minutes each</strong>, and the third period continues until the end of the ice slot. Games may be shortened at the discretion of league management.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">2. Roster Requirements</h3>
                <p>Each team must have exactly <strong>12 players</strong> on their roster. A minimum of <strong>8 players plus a goalie</strong> must be present to start a game.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">3. Spare Players</h3>
                <p>Spare players may be used to fill roster gaps. A spare player cannot be more than <strong>+1 level</strong> or <strong>-2 levels</strong> from the team's average rating. Spares are charged <strong>$40 per game</strong>.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">4. Player Eligibility</h3>
                <p>All players must be registered with the league and approved by league management before participating in games. Players must be at least 18 years old.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">5. Equipment Requirements</h3>
                <p>All players must wear <strong>full hockey gear including:</strong>
                <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                  <li>Approved hockey jerseys</li>
                  <li>Helmets with face masks</li>
                  <li><strong>Neck guards (mandatory)</strong></li>
                  <li>Gloves and shin guards</li>
                  <li>Full protective equipment</li>
                </ul>
                Goaltenders must wear full protective equipment including chest protector and goalie pads.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">6. Evaluation Games</h3>
                <p><strong>Two pickup games will be scheduled</strong> to evaluate all players and form team captains. These games are mandatory for all registered players and help determine team assignments and captain selections.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">7. Scoring</h3>
                <p>Win = 2 points, Tie = 1 point, Loss = 0 points. Bonus points may be awarded for specific achievements as determined by league management.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">8. Penalties & Suspensions</h3>
                <p>Players who accumulate excessive penalties or engage in unsportsmanlike conduct may be suspended. Suspension length is determined by league management based on the severity of the infraction.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">9. Playoff Format</h3>
                <p>The top teams at the end of the regular season will qualify for playoffs. Playoff format and seeding will be determined by league management.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">10. Code of Conduct</h3>
                <p>All players must conduct themselves professionally and respectfully. Harassment, discrimination, or violence will not be tolerated and may result in suspension or expulsion from the league.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">11. Venue & Schedule</h3>
                <p>Games are held at Samuel Moscovitch Arena on Tuesdays and Outremont Arena on Thursdays. Schedule changes must be approved by league management.</p>
              </section>

              <section>
                <h3 className="font-semibold text-foreground mb-2">12. Disputes & Appeals</h3>
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
                  <p className="text-sm">For a full team (12 players)</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Spare Player</h3>
                  <p className="text-2xl font-bold text-accent mb-2">$40</p>
                  <p className="text-sm">Per game when filling roster gaps</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Referee</h3>
                  <p className="text-2xl font-bold text-accent mb-2">$40-50</p>
                  <p className="text-sm">Per game (depending on location & experience)</p>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Scorekeeper</h3>
                  <p className="text-2xl font-bold text-accent mb-2">$25</p>
                  <p className="text-sm">Per game</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm text-foreground"><strong>Note:</strong> Jersey & Socks Set - Coming Soon! We're currently polling players on their preferences. This will be available to add to your registration costs soon.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
