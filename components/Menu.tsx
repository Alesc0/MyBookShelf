import { Badge, BadgeText } from '@/components/ui/badge';
import { MenuIcon } from '@/components/ui/icon';
import {
  Menu,
  MenuItem,
  MenuItemLabel,
  MenuSeparator,
} from '@/components/ui/menu';
import { Fab, FabIcon } from './ui/fab';
import { Plus } from 'lucide-react-native';

export default function FabMenu() {
  return (
    <Menu
      trigger={({ ...triggerProps }) => {
        return (
          <Fab {...triggerProps} className="m-6" size="lg">
            <FabIcon as={Plus} />
          </Fab>
        );
      }}
    >
      <MenuItem
        key="Membership"
        textValue="Membership"
        className="p-2 justify-between"
      >
        <MenuItemLabel size="lg">Membership</MenuItemLabel>
        <Badge action="success" className="rounded-full">
          <BadgeText className="text-2xs capitalize">Pro</BadgeText>
        </Badge>
      </MenuItem>
      <MenuItem key="Orders" textValue="Orders" className="p-2">
        <MenuItemLabel size="lg">Orders</MenuItemLabel>
      </MenuItem>
      <MenuItem key="Address Book" textValue="Address Book" className="p-2">
        <MenuItemLabel size="lg">Address Book</MenuItemLabel>
      </MenuItem>
      <MenuSeparator />
      <MenuItem key="Earn & Redeem" textValue="Earn & Redeem" className="p-2">
        <MenuItemLabel size="lg">Earn & Redeem</MenuItemLabel>
      </MenuItem>
      <MenuItem key="Coupons" textValue="Coupons" className="p-2">
        <MenuItemLabel size="lg">Coupons</MenuItemLabel>
      </MenuItem>
      <MenuItem key="Help Center" textValue="Help Center" className="p-2">
        <MenuItemLabel size="lg">Help Center</MenuItemLabel>
      </MenuItem>
      <MenuSeparator />
      <MenuItem key="Logout" textValue="Logout" className="p-2">
        <MenuItemLabel size="lg">Logout</MenuItemLabel>
      </MenuItem>
    </Menu>
  );
}