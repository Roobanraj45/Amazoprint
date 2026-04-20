'use client';

import { useState, useEffect, useTransition } from 'react';
import { getUsers, updateUserStatus } from '@/app/actions/user-actions';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type User = Awaited<ReturnType<typeof getUsers>>[0];

function UserStatusToggle({ user }: { user: User }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();

    const handleToggle = (isActive: boolean) => {
        startTransition(async () => {
            try {
                await updateUserStatus({ userId: user.id, isActive });
                toast({
                    title: 'Success',
                    description: `User ${user.name} has been ${isActive ? 'activated' : 'deactivated'}.`,
                });
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Error updating status',
                    description: error.message,
                });
            }
        });
    };

    return (
        <Switch
            checked={user.isActive ?? false}
            onCheckedChange={handleToggle}
            disabled={isPending}
            aria-label={`Toggle status for ${user.name}`}
        />
    );
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            try {
                const fetchedUsers = await getUsers();
                setUsers(fetchedUsers);
            } catch (error: any) {
                toast({
                    variant: 'destructive',
                    title: 'Failed to load users',
                    description: error.message,
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, [toast]);


    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Manage Users</h1>

            {isLoading ? (
                <div className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {users.map((user) => (
                        <Card key={user.id}>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                    <div className="flex items-center gap-4">
                                        <Avatar>
                                            <AvatarImage src={user.profileImage || undefined} />
                                            <AvatarFallback>{user.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{user.name}</CardTitle>
                                            <CardDescription>{user.email}</CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                                         <Badge variant={user.isActive ? 'default' : 'destructive'}>
                                            {user.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <UserStatusToggle user={user} />
                                    </div>
                                </div>
                            </CardHeader>
                             <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm pt-4 border-t">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Role</p>
                                        <p className="font-medium capitalize">{user.role}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Joined</p>
                                        <p className="font-medium">{format(new Date(user.createdAt!), 'PPP')}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
