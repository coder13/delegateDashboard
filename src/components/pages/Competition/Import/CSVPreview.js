import { Accordion, AccordionDetails, AccordionSummary, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

export default function CSVPreview({ CSVContents }) {
  return (
    <Accordion>
      <AccordionSummary>Preview</AccordionSummary>
      <AccordionDetails style={{
        display: 'flex',
        flexDirection: 'row',
        overflowX: 'auto',
        width: '80vw'
      }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {CSVContents.meta.fields.map((field, index) => (
                <TableCell key={field + index}>{field}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {CSVContents.data.slice(0, 5).map((row) => (
              <TableRow key={row.email}>
                {CSVContents.meta.fields.map((field, index) => (
                  <TableCell key={row.email + field + index}>{row[field]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AccordionDetails>
    </Accordion>
  )
}
