import type { ChangeEvent, JSX } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { MlmRank } from 'shared-types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface RankTableProps {
  readonly ranks: readonly MlmRank[];
  readonly onChange: (ranks: MlmRank[]) => void;
  readonly disabled?: boolean;
}

const EMPTY_RANK: MlmRank = { name: '', rewardPercentage: 0 };

// A rank's requirement fields are all optional (docs/20-settings-system.md #16 -
// a rank only sets the ones it actually checks), so a cleared field must become
// `undefined`, not 0 - reporting 0 would silently turn "no requirement" into
// "requires exactly zero".
const parseOptionalNumber = (event: ChangeEvent<HTMLInputElement>): number | undefined => {
  const parsed = event.target.valueAsNumber;

  return Number.isNaN(parsed) ? undefined : parsed;
};

// MLM Rank Settings (docs/20-settings-system.md #16) - admins edit every
// requirement freely. Purely controlled, same as PackageTable/CommissionTable.
const RankTable = ({ ranks, onChange, disabled = false }: RankTableProps): JSX.Element => {
  const updateRank = (index: number, patch: Partial<MlmRank>): void => {
    onChange(ranks.map((rank, rankIndex) => (rankIndex === index ? { ...rank, ...patch } : rank)));
  };

  const removeRank = (index: number): void => {
    onChange(ranks.filter((_rank, rankIndex) => rankIndex !== index));
  };

  const addRank = (): void => {
    onChange([...ranks, { ...EMPTY_RANK }]);
  };

  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Direct referrals</TableHead>
            <TableHead>Left team</TableHead>
            <TableHead>Right team</TableHead>
            <TableHead>Total team</TableHead>
            <TableHead>Reward %</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ranks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-muted-foreground py-6 text-center">
                No ranks yet.
              </TableCell>
            </TableRow>
          ) : (
            ranks.map((rank, index) => (
              // Ranks have no stable id beyond their own editable name - index is
              // fine since add/remove always happens at the end or via a row action.
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={rank.name}
                    onChange={(event) => updateRank(index, { name: event.target.value })}
                    disabled={disabled}
                    aria-label={`Rank ${index + 1} name`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={rank.directReferralsRequirement ?? ''}
                    onChange={(event) =>
                      updateRank(index, { directReferralsRequirement: parseOptionalNumber(event) })
                    }
                    disabled={disabled}
                    aria-label={`Rank ${index + 1} direct referrals requirement`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={rank.leftTeamRequirement ?? ''}
                    onChange={(event) =>
                      updateRank(index, { leftTeamRequirement: parseOptionalNumber(event) })
                    }
                    disabled={disabled}
                    aria-label={`Rank ${index + 1} left team requirement`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={rank.rightTeamRequirement ?? ''}
                    onChange={(event) =>
                      updateRank(index, { rightTeamRequirement: parseOptionalNumber(event) })
                    }
                    disabled={disabled}
                    aria-label={`Rank ${index + 1} right team requirement`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={rank.totalTeamRequirement ?? ''}
                    onChange={(event) =>
                      updateRank(index, { totalTeamRequirement: parseOptionalNumber(event) })
                    }
                    disabled={disabled}
                    aria-label={`Rank ${index + 1} total team requirement`}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={rank.rewardPercentage}
                    onChange={(event) =>
                      updateRank(index, { rewardPercentage: event.target.valueAsNumber || 0 })
                    }
                    disabled={disabled}
                    aria-label={`Rank ${index + 1} reward percentage`}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRank(index)}
                    disabled={disabled}
                    aria-label={`Remove rank ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <Button type="button" variant="outline" size="sm" onClick={addRank} disabled={disabled}>
        <Plus className="h-4 w-4" />
        Add rank
      </Button>
    </div>
  );
};

export default RankTable;
