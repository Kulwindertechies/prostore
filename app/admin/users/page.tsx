import { Metadata } from "next";
import { getAllUsers, deleteUser } from "@/lib/actions/user.actions";
import {  formatId } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DeleteDialog from "@/components/shared/delete-dialog";
import Pagination from '@/components/shared/pagination';
import { Badge } from "@/components/ui/badge";


export const metadata: Metadata = {
    title: 'Admin Users',
};

const AdminUserPage = async (props: {
    searchParams: Promise<{
        page: string;
        query:string
    }>
}) => {
    const { page = '1', query:searchText } = await props.searchParams;

    const users = await getAllUsers({ page: Number(page), query: searchText });

    return (
        <div className='space-y-2'>
            <div className='flex items-center gap-3'>
          <h1 className='h2-bold'>Uesers</h1>
          {searchText && (
            <div>
              Filtered by <i>&quot;{searchText}&quot;</i>{' '}
              <Link href='/admin/users'>
                <Button variant='outline' size='sm'>
                  Remove Filter
                </Button>
              </Link>
            </div>
          )}
        </div>
            <div className='overflow-x-auto'>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>NAME</TableHead>
                            <TableHead>EMAIL</TableHead>
                            <TableHead>ROLE</TableHead>
                            <TableHead>ACTIONS</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.data.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{formatId(user.id)}</TableCell>
                                <TableCell>
                                    {user.name}
                                </TableCell>
                                <TableCell>
                                    {user.email}
                                </TableCell>
                                <TableCell>
                                    {user.role === 'user' ? (
                                        <Badge variant='secondary'>User</Badge>
                                    ) : (
                                        <Badge variant='default'>Admin</Badge>
                                    )}
                                </TableCell>

                                <TableCell>
                                    <Button asChild variant='outline' size='sm'>
                                        <Link href={`/admin/users/${user.id}`}> Edit </Link>
                                    </Button>
                                    {/* deleteOrder */}
                                    <DeleteDialog id={user.id} action={deleteUser}/>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {users.totalPages > 1 && (
                    <Pagination
                        page={Number(page) || 1}
                        totalPages={users?.totalPages}
                    />
                )}
            </div>
        </div>
    );
}

export default AdminUserPage