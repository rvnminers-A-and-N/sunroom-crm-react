import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

describe('Table', () => {
  it('renders all sub-components with merged classes', () => {
    render(
      <Table className="t-x">
        <TableCaption className="cap-x">Cap</TableCaption>
        <TableHeader className="th-x">
          <TableRow className="tr-x">
            <TableHead className="head-x">A</TableHead>
            <TableHead>B</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="tb-x">
          <TableRow>
            <TableCell className="tc-x">1</TableCell>
            <TableCell>2</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter className="tf-x">
          <TableRow>
            <TableCell colSpan={2}>Footer</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

    expect(document.querySelector('[data-slot="table-container"]')).toBeInTheDocument();
    expect(document.querySelector('[data-slot="table"]')).toHaveClass('t-x');
    expect(document.querySelector('[data-slot="table-header"]')).toHaveClass('th-x');
    expect(document.querySelector('[data-slot="table-body"]')).toHaveClass('tb-x');
    expect(document.querySelector('[data-slot="table-footer"]')).toHaveClass('tf-x');
    expect(document.querySelector('[data-slot="table-row"]')).toHaveClass('tr-x');
    expect(document.querySelector('[data-slot="table-head"]')).toHaveClass('head-x');
    expect(document.querySelector('[data-slot="table-cell"]')).toHaveClass('tc-x');
    expect(document.querySelector('[data-slot="table-caption"]')).toHaveClass('cap-x');
    expect(screen.getByText('Cap')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('renders without optional className props', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>X</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Y</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(document.querySelector('[data-slot="table"]')).toBeInTheDocument();
  });
});
