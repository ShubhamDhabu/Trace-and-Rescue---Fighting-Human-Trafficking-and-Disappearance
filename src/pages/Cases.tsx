import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Case } from '@/types/database';
import { Search, Eye, Lock, Calendar, MapPin, User, Phone, FileText, Building, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

export default function Cases() {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  useEffect(() => {
    fetchCases();
  }, [user]);

  async function fetchCases() {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .or(`user_id.eq.${user.id},is_public.eq.true`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  }

  /** 🔥 Universal case status updater */
  async function updateCaseStatus(caseId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('cases')
        .update({ status: newStatus })
        .eq('id', caseId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Case marked as ${newStatus}.`,
      });

      await fetchCases();
      setSelectedCase(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Update Failed",
        description: "Could not update case status.",
        variant: "destructive"
      });
    }
  }

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesVisibility =
      visibilityFilter === 'all' ||
      (visibilityFilter === 'public' && c.is_public) ||
      (visibilityFilter === 'private' && !c.is_public);

    return matchesSearch && matchesStatus && matchesVisibility;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading cases...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div>
          <h2 className="text-3xl font-bold mb-2">Case Management</h2>
          <p className="text-muted-foreground">View and manage all accessible missing person cases</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="not_found">Not Found</SelectItem>
                </SelectContent>
              </Select>

              <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cases</SelectItem>
                  <SelectItem value="public">Public Cases</SelectItem>
                  <SelectItem value="private">My Private Cases</SelectItem>
                </SelectContent>
              </Select>

            </div>
          </CardContent>
        </Card>

        {/* Grid of Cases */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredCases.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <p className="text-muted-foreground">No cases found matching your filters.</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredCases.map((caseData) => (
              <Card key={caseData.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {caseData.photo_url && (
                  <div className="aspect-square bg-muted">
                    <img src={caseData.photo_url} alt={caseData.full_name} className="w-full h-full object-cover" />
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-lg">{caseData.full_name}</CardTitle>

                    <div className="flex gap-2">
                      {caseData.is_public ? (
                        <Badge variant="secondary" className="gap-1"><Eye className="h-3 w-3" />Public</Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />Private</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                    {caseData.age && <span>{caseData.age} years old</span>}
                    {caseData.gender && <span>• {caseData.gender}</span>}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <Badge variant={caseData.status === 'active' ? 'default' : 'secondary'}>
                    {caseData.status}
                  </Badge>

                  {caseData.last_seen_location && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /> {caseData.last_seen_location}
                    </div>
                  )}

                  {caseData.last_seen_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      Last seen: {format(new Date(caseData.last_seen_date), 'MMM d, yyyy')}
                    </div>
                  )}

                  <Button variant="outline" className="w-full mt-4" onClick={() => setSelectedCase(caseData)}>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={!!selectedCase} onOpenChange={(open) => !open && setSelectedCase(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Case Details</DialogTitle>
            <DialogDescription>Complete information about this missing person case.</DialogDescription>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-6">

              {/* Main Section */}
              <div className="flex flex-col md:flex-row gap-6">
                {selectedCase.photo_url && (
                  <div className="w-full md:w-64 h-64 overflow-hidden rounded-lg bg-muted">
                    <img src={selectedCase.photo_url} alt={selectedCase.full_name} className="w-full h-full object-cover" />
                  </div>
                )}

                <div className="flex-1 space-y-4">
                  <h3 className="text-2xl font-bold">{selectedCase.full_name}</h3>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={selectedCase.is_public ? "secondary" : "outline"}>
                      {selectedCase.is_public ? <Eye className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                      {selectedCase.is_public ? "Public Case" : "Private Case"}
                    </Badge>

                    <Badge variant={selectedCase.status === "active" ? "default" : "secondary"}>
                      {selectedCase.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {selectedCase.age && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Age</p>
                          <p className="font-medium">{selectedCase.age} years</p>
                        </div>
                      </div>
                    )}

                    {selectedCase.gender && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Gender</p>
                          <p className="font-medium capitalize">{selectedCase.gender}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/*  Action Buttons */}
              {selectedCase.user_id === user?.id && selectedCase.status !== 'closed' && (
                <>
                  <Separator />
                  <div className="flex flex-wrap justify-end gap-3">

                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white gap-2"
                      onClick={() => updateCaseStatus(selectedCase.id, "resolved")}
                    >
                      <Eye className="h-4 w-4" /> Mark as Found
                    </Button>

                    <Button
                      variant="secondary"
                      className="gap-2"
                      onClick={() => updateCaseStatus(selectedCase.id, "not_found")}
                    >
                      <XCircle className="h-4 w-4" /> Mark as Not Found
                    </Button>

                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => updateCaseStatus(selectedCase.id, "closed")}
                    >
                      <XCircle className="h-4 w-4" /> Close Case
                    </Button>

                  </div>
                </>
              )}

              <Separator />

              {/* Location and Date Info */}
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Last Known Information</h4>

                <div className="grid gap-4 md:grid-cols-2">
                  
                  {selectedCase.last_seen_location && (
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Last Seen Location</p>
                        <p className="font-medium">{selectedCase.last_seen_location}</p>
                      </div>
                    </div>
                  )}

                  {selectedCase.last_seen_date && (
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Last Seen Date</p>
                        <p className="font-medium">{format(new Date(selectedCase.last_seen_date), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}

                  {selectedCase.date_registered && (
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Date Registered</p>
                        <p className="font-medium">{format(new Date(selectedCase.date_registered), 'MMMM d, yyyy')}</p>
                      </div>
                    </div>
                  )}

                  {selectedCase.branch_department && (
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                      <Building className="h-5 w-5 mt-0.5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Branch/Department</p>
                        <p className="font-medium">{selectedCase.branch_department}</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Description */}
              {selectedCase.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" /> Description
                    </h4>
                    <p className="text-muted-foreground">{selectedCase.description}</p>
                  </div>
                </>
              )}

              {/* Contact */}
              {selectedCase.contact_info && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Phone className="h-5 w-5" /> Contact Information
                    </h4>
                    <p className="text-muted-foreground">{selectedCase.contact_info}</p>
                  </div>
                </>
              )}

              {/* Additional */}
              {selectedCase.additional_details && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" /> Additional Details
                    </h4>
                    <p className="text-muted-foreground">{selectedCase.additional_details}</p>
                  </div>
                </>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>

    </DashboardLayout>
  );
}
