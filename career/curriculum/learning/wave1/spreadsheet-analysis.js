'use strict';
const {course}=require('./data-wave3-helper');
const specs=[
  {
    "id": "sheet-references",
    "comps": [
      "m1.c1"
    ],
    "title": "Copy formulas while preserving reference intent",
    "intro": "A finance assistant builds a price model in Excel. Copying a formula is a transformation of cell references: a relative coordinate moves with the formula, while an absolute coordinate stays anchored.",
    "sections": [
      [
        "Read the formula as a relationship",
        "In A1 notation, A2 is relative in both dimensions, $A$2 fixes both column and row, $A2 fixes the column and A$2 fixes the row. Copying down changes relative row coordinates; copying right changes relative columns. A dollar sign changes reference behavior, not the stored value, numeric format or protection setting.",
        "For a tax calculation in D2 using price in B2 and a single rate in F1, =B2*$F$1 keeps the shared rate fixed while each row uses its own price. A copied formula should be inspected in the first, middle and last rows. Correct-looking output on a row containing zero can hide a shifted reference."
      ],
      [
        "Test the copy contract separately from arithmetic",
        "Use a small fixture whose values make incorrect references observable. Document units and locate shared assumptions in labeled input cells rather than scattering constants across formulas. Mixed references become useful in a two-dimensional rate matrix, where a product row and a region column must move differently.",
        "The Python fixture below models the chosen references as explicit list indexing and a shared rate. It verifies the arithmetic intended by =B2*$F$1 and prints the expected copied formula. It is not an Excel or Google Sheets formula engine and does not test formula translation, workbook calculation modes or application-specific syntax. Workbook behavior still needs a manual application review."
      ]
    ],
    "problem": "Model the intended arithmetic of a copied tax formula and state the translated reference.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "prices=[100,250]\nrate=0.2\nprint([round(p*rate,2) for p in prices])\nprint(\"D3: =B3*$F$1\")",
    "expect": "[20.0, 50.0]\nD3: =B3*$F$1",
    "limit": "Python checks arithmetic and an explicitly stated reference contract. Excel and Google Sheets are not executed; dollar-reference translation requires workbook review.",
    "practice": [
      [
        "Which reference fixes row and column?",
        "$A$1",
        "A1",
        "$A1",
        "A$1",
        "Both dollar signs anchor their respective coordinate when the formula is copied."
      ],
      [
        "What does $A1 keep fixed?",
        "The column",
        "The row",
        "Both coordinates",
        "Neither coordinate",
        "A dollar sign before the column anchors the column while the row remains relative."
      ],
      [
        "What happens to A1 when copied one row down?",
        "It becomes A2",
        "It becomes B1",
        "It stays $A$1",
        "It becomes A0",
        "A relative row advances with a one-row downward copy."
      ],
      [
        "A tax formula copies =B2*F1 downward and the rate shifts to F2. What fixes the intent?",
        "Anchor the rate cell",
        "Anchor only the price",
        "Format as currency",
        "Widen the rate column",
        "The common assumption should remain at an absolute reference while each row’s price remains relative."
      ],
      [
        "A matrix needs row labels fixed by column and headers fixed by row. Which tool fits?",
        "Mixed references",
        "Random constants",
        "Only chart sorting",
        "Merged cells everywhere",
        "Mixed references allow one coordinate to move while the other stays fixed during copying."
      ],
      [
        "A copied formula looks correct only on zero-priced rows. What should review use?",
        "Distinct nonzero inputs",
        "Only zero values",
        "Only cell colors",
        "Only hidden rows",
        "Nonzero, distinct inputs expose shifted-reference errors that zero inputs can conceal."
      ],
      [
        "A worksheet shows $A$1. Does this protect the cell from editing?",
        "No; it anchors references",
        "Yes; it locks all editing",
        "Only in currency format",
        "Only after a copy",
        "Absolute references control copy behavior and are separate from sheet protection."
      ]
    ],
    "formal": [
      [
        "What does A$1 fix during copying?",
        "The row",
        "The column",
        "The cell value",
        "The number format",
        "The dollar sign before the row number anchors that coordinate."
      ],
      [
        "What changes when =B2*$F$1 is copied one row down?",
        "B2 becomes B3",
        "F1 becomes F2",
        "B2 becomes C2",
        "Both references vanish",
        "The row-relative price reference moves while the absolute assumption remains fixed."
      ],
      [
        "What is a literal constant in a formula?",
        "A directly typed value",
        "Any named worksheet",
        "Every relative cell",
        "Only a missing value",
        "A literal is embedded in the formula rather than read through a reference."
      ],
      [
        "An analyst copies =A2+B2 one column right. What is the intended translation?",
        "=B2+C2",
        "=A3+B3",
        "=$A$2+$B$2",
        "=A2+B2",
        "Both column-relative references move one column with a horizontal copy."
      ],
      [
        "A price table uses the same shared discount across every row. Which reference suits its single input cell?",
        "An absolute reference",
        "A moving row reference",
        "An arbitrary text label",
        "An unrelated subtotal",
        "A fixed assumption cell should remain stable when row formulas are copied."
      ],
      [
        "A model has the tax rate typed separately into 300 formulas. What improves maintainability?",
        "One labeled input cell",
        "More decimal places only",
        "A larger font on every row",
        "A hidden duplicate worksheet",
        "A shared referenced assumption can be reviewed and changed consistently rather than editing many constants."
      ],
      [
        "In a two-way pricing grid, B2 contains =$A2*B$1. It is filled to C3. Row 3 has a different quantity and C1 a different rate. What formula and check jointly verify the intended mixed references?",
        "=$A3*C$1; test distinct row and column inputs",
        "=$A$2*C$1; test several rates on the first row",
        "=$A3*$B$1; test quantities down the first column",
        "=$A2*C1; compare only the final grand total",
        "Filling one row and one column changes relative row 2 to 3 and relative column B to C. Column A and row 1 stay anchored. Distinct inputs in both directions expose either incorrectly fixed dimension."
      ],
      [
        "A user adds dollar signs and expects frozen values after inputs change. What is mistaken?",
        "Anchors still recalculate",
        "Recalculation stops",
        "Inputs become literals",
        "Cells become locked",
        "Absolute references still read their referenced cells and can recalculate when those inputs change."
      ],
      [
        "A Python fixture reproduces a spreadsheet total. What does that validate?",
        "Fixture arithmetic",
        "Excel copy rules",
        "Workbook modes",
        "Type coercion",
        "A Python model verifies its own computation and cannot establish native spreadsheet engine behavior."
      ],
      [
        "A copied tax formula should multiply each row’s price by $F$1. The final row instead uses F20; F20 currently equals F1, and the grand total matches. Which controlled review can reveal the latent boundary fault?",
        "Change F1 alone, recalculate, and inspect edge formulas",
        "Compare the matching total with a second export unchanged",
        "Change the final price only and verify its tax changes",
        "Copy the final displayed value back into the same cell",
        "Equal current rate values conceal a shifted reference. Varying F1 while keeping F20 fixed distinguishes the intended absolute dependency; inspecting edge formulas identifies the fill error even before an observed total diverges."
      ]
    ],
    "mistakes": [
      "Dollar signs anchor references; they do not lock values or protect cells.",
      "A Python arithmetic model is not native spreadsheet execution."
    ],
    "takeaways": [
      "Choose relative, absolute or mixed coordinates deliberately.",
      "Inspect copied formulas with values that expose mistakes."
    ],
    "lang": "python"
  },
  {
    "id": "sheet-criteria",
    "comps": [
      "m1.c1",
      "m1.c2"
    ],
    "title": "Use IF, SUMIFS and COUNTIFS with coherent ranges",
    "intro": "A sales analyst must calculate approved regional sales and count qualifying orders. Conditional formulas are useful only when their criteria and ranges represent the same rows and business rules.",
    "sections": [
      [
        "Define the condition before choosing a function",
        "IF chooses one result for a logical condition and another for the alternative. SUMIFS adds values only for rows satisfying all specified criteria pairs; COUNTIFS counts rows satisfying all criteria. Excel formulas such as =SUMIFS(C2:C5,A2:A5,\"North\",B2:B5,\"Approved\") require aligned ranges and a declared meaning for the amount column.",
        "Several criteria in one SUMIFS are combined with AND. To express OR across disjoint categories, separate sums may be added, but overlapping conditions can double count. Criteria strings can contain comparison operators; the operator and referenced threshold often need concatenation, such as \">=\"&F1. Formula separators and function names can vary by locale."
      ],
      [
        "Do not hide data problems inside conditions",
        "A blank, a numeric zero and a text value that looks like a number can behave differently. Validate the input representation and use consistent category labels. An IF result of zero for ineligible rows should not be mistaken for a measured zero on eligible rows when later calculating averages.",
        "The Python model below selects exact matching strings and sums numeric amounts. It checks the intended business predicate and count, not Excel coercion, wildcard semantics, locale handling or native evaluation. Those boundaries are deliberate: application review must enter the actual formulas and inspect blanks, text numbers and errors before the workbook is accepted."
      ]
    ],
    "problem": "Model an AND criterion for approved North-region orders.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "rows=[(\"North\",\"Approved\",100),(\"North\",\"Pending\",70),(\"South\",\"Approved\",90),(\"North\",\"Approved\",50)]\nselected=[v for region,status,v in rows if region==\"North\" and status==\"Approved\"]\nprint(sum(selected),len(selected))\nprint(\"eligible\" if len(selected)>=2 else \"review\")",
    "expect": "150 2\neligible",
    "limit": "Python validates an explicit exact-string AND predicate on clean values. Native IF/SUMIFS/COUNTIFS parsing, wildcard matching and coercion remain unexecuted.",
    "practice": [
      [
        "What does SUMIFS aggregate?",
        "Matching amounts",
        "Every label length",
        "Only unique keys",
        "Only chart totals",
        "SUMIFS adds values from the sum range for rows satisfying all specified criteria."
      ],
      [
        "What does COUNTIFS return?",
        "Matching row count",
        "The sum of amounts",
        "The largest date",
        "A text label",
        "COUNTIFS counts rows that meet all of the supplied criteria pairs."
      ],
      [
        "How are criteria combined within SUMIFS?",
        "AND",
        "OR always",
        "Randomly",
        "By the longest label",
        "A row must satisfy every criteria pair within a single SUMIFS call."
      ],
      [
        "A sum range starts at row 2 but criteria start at row 3. What is wrong?",
        "Range alignment",
        "Only header color",
        "Only result precision",
        "Only sheet naming",
        "The ranges must correspond to the same observations and have compatible dimensions."
      ],
      [
        "A report adds totals for North and Approved even though some rows satisfy both. What can occur?",
        "Double counting",
        "Automatic deduplication",
        "Guaranteed zero totals",
        "A causal estimate",
        "Adding overlapping OR-condition totals counts their intersection more than once unless handled explicitly."
      ],
      [
        "An IF returns zero for excluded cases and the analyst averages all results. What changed?",
        "Population averaged",
        "Only column labels",
        "Only file size",
        "Only formula spelling",
        "Inserted zeros remain numeric observations and can lower an average compared with excluding ineligible cases."
      ],
      [
        "A formula works in one locale but separators differ in another. What is needed?",
        "Locale review",
        "A larger chart",
        "Only more rows",
        "Only a random seed",
        "Spreadsheet syntax and function naming can vary with locale, so native entry and interpretation need review."
      ]
    ],
    "formal": [
      [
        "What does IF evaluate first?",
        "A logical condition",
        "The workbook author",
        "The chart palette",
        "The last visible row",
        "IF branches according to whether its logical test evaluates as true or false."
      ],
      [
        "Which formula family fits multiple AND criteria?",
        "SUMIFS or COUNTIFS",
        "Only a chart type",
        "Only a sort command",
        "Only a manual filter screenshot",
        "These functions directly express an aggregate or count subject to multiple criteria pairs."
      ],
      [
        "What should aligned ranges describe?",
        "The same records",
        "Only equal font sizes",
        "Only matching sheet colors",
        "Only equal header lengths",
        "Corresponding positions must refer to the same business observations for criteria to filter the intended values."
      ],
      [
        "A manager wants approved orders in North, not either category. Which predicate matches?",
        "Region AND status",
        "Region OR status",
        "Only region",
        "Only status",
        "The intended subset contains rows meeting both eligibility conditions."
      ],
      [
        "A COUNTIFS result is used as sales currency. What is the error?",
        "Count versus amount",
        "A missing color",
        "A longer title",
        "Only decimal formatting",
        "A row count is a different quantity from a sum of monetary values and cannot be substituted by formatting."
      ],
      [
        "A category contains trailing spaces and exact criteria miss rows. What should be checked?",
        "Text normalization",
        "Only sum precision",
        "Only chart orientation",
        "Only cell borders",
        "Inconsistent category representations can prevent intended exact matches and should be cleaned under a documented rule."
      ],
      [
        "An OR calculation adds two overlapping criteria totals. What correction is needed?",
        "Subtract overlap",
        "Add totals unchanged",
        "Count overlap twice",
        "Take the larger total",
        "The union requires avoiding double counting rows that meet both conditions."
      ],
      [
        "An analyst hardcodes a threshold inside many criteria strings. What improves reviewability?",
        "One threshold cell",
        "Repeat constants",
        "Use comments alone",
        "Paste result values",
        "A shared visible assumption is easier to inspect and update consistently than repeated hidden constants."
      ],
      [
        "A Python filter matches the expected SUMIFS result on clean data. What remains unverified?",
        "Excel behavior",
        "Wildcard rules",
        "Locale separators",
        "Type coercion",
        "The arithmetic model does not test spreadsheet coercion, wildcard behavior, formula syntax or locale rules."
      ],
      [
        "A workbook uses text-formatted numbers and blanks in totals. Which verification is needed?",
        "Native edge-case checks",
        "Only a clean numeric fixture",
        "Only a PDF export of the total",
        "Only the source row count",
        "The target spreadsheet application must be checked on the actual representations because coercion and blank handling affect results."
      ]
    ],
    "mistakes": [
      "SUMIFS combines its criteria with AND, not OR.",
      "Formatting text as currency does not establish numeric storage."
    ],
    "takeaways": [
      "Keep criteria and values aligned to the same rows.",
      "Validate representation and population effects before aggregating."
    ],
    "lang": "python"
  },
  {
    "id": "sheet-dates",
    "comps": [
      "m1.c2"
    ],
    "title": "Clean text keys and define date windows without ambiguity",
    "intro": "A service report groups requests by month and matches account codes supplied by several teams. Spreadsheet displays can make unlike underlying values look identical, so cleaning and date logic need explicit contracts.",
    "sections": [
      [
        "Clean representation without destroying meaning",
        "TRIM removes extra ordinary spaces in Excel and CLEAN removes certain nonprinting characters; neither should be treated as a universal Unicode cleaner. In particular, nonbreaking spaces can require explicit replacement. Keep raw text beside the cleaned result and count changed records. Do not strip leading zeros from account identifiers simply because they look numeric.",
        "Use text functions according to known structure rather than assuming every key has the same length. A useful cleaning policy names the allowed characters, case convention and whitespace treatment. Different raw values may collapse to the same normalized key, so uniqueness must be checked after normalization before any lookup."
      ],
      [
        "Use typed dates and half-open intervals",
        "A displayed date can be a real date value or text. Prefer explicit construction such as DATE(2026,1,1) and verify parsing under the intended locale. For timestamps, a month filter using >= month_start and < next_month_start avoids dropping events late on the last day; <= a date-only endpoint can represent midnight rather than the end of that day.",
        "Excel serial-date systems and application locale behavior differ from Python datetime objects and can differ between workbooks. The fixture uses explicit Python date-time objects and an explicitly specified normalization policy. It demonstrates the intended business rules only. It does not run TRIM, CLEAN, DATE or spreadsheet serial conversions, including Excel’s historic 1900 date-system compatibility behavior."
      ]
    ],
    "problem": "Model a text-key policy and an inclusive-start, exclusive-end month window.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "from datetime import datetime\nraw=\"  001\\u00a0\"\nkey=raw.replace(\"\\u00a0\",\" \").strip()\nstart=datetime(2026,1,1);end=datetime(2026,2,1)\nevents=[datetime(2026,1,31,23,59),datetime(2026,2,1)]\nprint(repr(key))\nprint([start<=x<end for x in events])",
    "expect": "'001'\n[True, False]",
    "limit": "Python applies a declared Unicode replacement and datetime window. It does not verify spreadsheet cleaning functions, locale parsing or serial-date systems.",
    "practice": [
      [
        "Why preserve leading zeros in account keys?",
        "They carry identifier meaning",
        "They prove a larger amount",
        "They always cause errors",
        "They are only decoration",
        "Identifiers are labels whose representation can be meaningful even when every character is a digit."
      ],
      [
        "What is a half-open date window?",
        "Inclusive start only",
        "Both endpoints excluded",
        "Only the final second",
        "Every date after the end",
        "A half-open interval includes its start and excludes the next period’s start, avoiding overlapping boundaries."
      ],
      [
        "Does Excel TRIM remove every Unicode whitespace character?",
        "No",
        "Always",
        "Only for dates",
        "Only in a pivot",
        "TRIM targets ordinary spaces and is not a universal Unicode whitespace normalizer."
      ],
      [
        "A report omits January 31 at 23:59 using <= January 31 midnight. What fixes the boundary?",
        "Use < February 1",
        "Drop the time field",
        "Count February instead",
        "Change only the display",
        "An exclusive next-month start includes all valid January timestamps without assuming a final time precision."
      ],
      [
        "Two distinct raw codes become one cleaned key. What should be checked?",
        "Key collisions",
        "Only cell color",
        "Only column width",
        "Only print settings",
        "Normalization can merge representations and create duplicate keys that affect matching and aggregation."
      ],
      [
        "A date string 03/04/2026 changes meaning across locales. What helps?",
        "Construct typed dates",
        "Only a currency format",
        "Only alphabetic sorting",
        "Only a longer filename",
        "An explicit date value or documented unambiguous parsing contract avoids month/day ambiguity."
      ],
      [
        "A user assumes Python strip proves Excel TRIM behavior. What is wrong?",
        "Different function semantics",
        "Only unequal row counts",
        "Only the font size",
        "Only the timestamp precision",
        "Python and Excel functions can differ in which characters they remove, so the model cannot certify native cleaning."
      ]
    ],
    "formal": [
      [
        "What should remain beside a cleaned key?",
        "The raw value",
        "Only a screenshot",
        "Only a running total",
        "Only the worksheet logo",
        "Raw values preserve evidence for auditing transformation effects and resolving collisions."
      ],
      [
        "What does a date display format establish?",
        "Display only",
        "All inputs are dates",
        "Parsing is unique",
        "Time zones are valid",
        "Formatting controls presentation and does not prove the underlying value has the intended type or semantics."
      ],
      [
        "Which boundary avoids overlapping adjacent months?",
        "Exclusive next-month start",
        "Inclusive starts and ends",
        "An arbitrary last second",
        "A text-only comparison",
        "Using the next period’s start as an exclusive end gives adjacent periods nonoverlapping boundaries."
      ],
      [
        "A spreadsheet displays a text value like a date. What should review inspect?",
        "The underlying type",
        "Only the text alignment",
        "Only the header font",
        "Only the file name",
        "A date-looking string may not behave as a real date in comparisons or calculations."
      ],
      [
        "A nonbreaking space remains after TRIM. What is appropriate?",
        "Explicit replacement",
        "Assume the key is clean",
        "Delete every digit",
        "Only widen the cell",
        "Known nonbreaking spaces may need explicit replacement, with raw values retained for review."
      ],
      [
        "An analyst converts postal codes to numbers before matching. What may be lost?",
        "Meaningful leading zeros",
        "The number of columns",
        "Only a chart legend",
        "Only a formula name",
        "Numeric conversion can erase the original identifier representation and cause mismatches or collisions."
      ],
      [
        "A monthly report includes the next month’s midnight in both periods. What is the error?",
        "Overlapping periods",
        "A missing final day",
        "Wrong timezone",
        "Text-only parsing",
        "Inclusive boundaries at the shared endpoint double count events on that boundary."
      ],
      [
        "A cleaning step changes account case and removes punctuation. What should follow?",
        "Check key collisions",
        "Raw uniqueness only",
        "Changed-key count",
        "Lookup total alone",
        "Different identifiers may collapse after normalization, so key collisions must be examined before joining or lookup."
      ],
      [
        "A workbook switches between 1900 and 1904 date systems. What must be verified?",
        "Date-system rules",
        "Display format",
        "Serial digit count",
        "File readability",
        "Serial values depend on the workbook’s date system and can shift interpreted dates if moved without reconciliation."
      ],
      [
        "A Python datetime fixture passes all month-boundary checks. What needs application review?",
        "Native date rules",
        "Python output",
        "Export size",
        "Text sort order",
        "Native serial dates, locale parsing and formula evaluation remain outside the Python model’s evidence."
      ]
    ],
    "mistakes": [
      "Cleaning can merge distinct identifiers.",
      "Date formatting is not proof of date storage or parsing correctness."
    ],
    "takeaways": [
      "Retain raw values and audit normalization effects.",
      "Use explicit types and nonoverlapping time windows."
    ],
    "lang": "python"
  },
  {
    "id": "sheet-lookup",
    "comps": [
      "m2.c1"
    ],
    "title": "Choose exact lookups and preserve return-column meaning",
    "intro": "A purchasing workbook maps supplier codes to payment terms. A lookup needs a defined key domain, exactness policy and return field; finding some value is not enough if the formula returns the wrong attribute.",
    "sections": [
      [
        "Express the lookup contract",
        "In current Excel versions supporting XLOOKUP, =XLOOKUP(A2,Suppliers[Code],Suppliers[Terms],\"Missing\",0) requests an exact key match and a terms value. XLOOKUP defaults to exact matching, but specifying match mode can make intent visible. Availability varies by application and version; do not assume an older Excel installation supports the function.",
        "A broadly available alternative is =INDEX(C2:C5,MATCH(A2,A2:A5,0)). The final zero requests exact matching in MATCH; omitting match_type in traditional MATCH requests approximate behavior and assumes an appropriate ordering. INDEX returns the position from a separately chosen result range, so the lookup and result ranges must describe corresponding rows."
      ],
      [
        "Test meaning, not just a successful return",
        "Use identifiers with the intended type and format on both sides. A numeric 7 and text 007 may refer to different business keys. If a return field can itself be blank or zero, distinguish that valid matched value from a missing key. Test a known match, a known miss and a known key whose return value is zero.",
        "The fixture models exact matching with a Python dictionary constructed from an explicitly unique mapping. It checks key membership before reading the result. Dictionaries do not reproduce native XLOOKUP or INDEX/MATCH rules for duplicates, approximate matches, text collation, wildcard behavior, errors or spreadsheet type coercion. Those cases require target-application review."
      ]
    ],
    "problem": "Model an exact lookup while retaining a valid zero return value.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "suppliers={\"007\":30,\"009\":0}\nfor key in [\"007\",\"009\",\"7\"]:\n print(key,suppliers[key] if key in suppliers else \"Missing\")",
    "expect": "007 30\n009 0\n7 Missing",
    "limit": "Python exact dictionary keys model a clean unique-key contract. Native lookup formulas, coercion, duplicates and version availability remain unexecuted.",
    "practice": [
      [
        "What does MATCH with match_type 0 request?",
        "An exact match",
        "Always the nearest value",
        "Only the last row",
        "A random return column",
        "A zero match_type requests exact matching rather than the approximate traditional default."
      ],
      [
        "What does INDEX use to return a value?",
        "A range position",
        "Only a key’s spelling",
        "Only the first header",
        "Only the largest number",
        "INDEX retrieves a value by position in the specified return range."
      ],
      [
        "What is XLOOKUP’s default match mode in supporting Excel versions?",
        "Exact match",
        "Approximate ascending only",
        "Approximate descending only",
        "Always a wildcard",
        "XLOOKUP defaults to exact matching, unlike an omitted traditional MATCH match_type."
      ],
      [
        "A lookup returns the supplier’s city instead of terms. What should be inspected?",
        "The return range",
        "Only the key’s font",
        "Only the workbook title",
        "Only the chart order",
        "The correct key can still produce the wrong attribute if the result range points at the wrong field."
      ],
      [
        "A zero-day payment term is treated as no match. What is wrong?",
        "Value versus membership",
        "Only decimal precision",
        "Only row alignment",
        "Only sheet protection",
        "A matched zero is a legitimate value and must be distinguished from absence of a key."
      ],
      [
        "An older Excel workbook shows an unsupported XLOOKUP function. What is appropriate?",
        "Use a supported alternative",
        "Delete all supplier codes",
        "Trust the displayed errors",
        "Only resize the column",
        "Function availability depends on the application version, so an exact INDEX/MATCH alternative may be needed."
      ],
      [
        "A Python dictionary lookup succeeds. Does it certify Excel matching on mixed numeric/text keys?",
        "No native verification",
        "Yes for every workbook",
        "Only if keys look numeric",
        "Only if the result is zero",
        "Python dictionary equality and spreadsheet matching/coercion rules are different mechanisms."
      ]
    ],
    "formal": [
      [
        "Which argument in exact INDEX/MATCH identifies the key position?",
        "MATCH result",
        "The sheet’s color",
        "The workbook author",
        "The sum of all values",
        "MATCH locates the key’s position for INDEX to use in the corresponding return range."
      ],
      [
        "What must lookup and return ranges preserve?",
        "Row correspondence",
        "Only equal file sizes",
        "Only matching font names",
        "Only sorted column names",
        "The returned position must refer to the same record in both ranges."
      ],
      [
        "Which lookup test distinguishes a valid zero from absence?",
        "Known zero and missing key",
        "Only positive matches",
        "Only the largest amount",
        "Only header spelling",
        "Testing both cases protects the difference between key membership and a false-like return value."
      ],
      [
        "A formula omits MATCH’s final argument in an exact supplier search. What should change?",
        "Specify match_type zero",
        "Only use a wider column",
        "Only sort supplier cities",
        "Only add currency format",
        "Traditional MATCH’s omitted match_type is approximate, so exact intent should be made explicit."
      ],
      [
        "A lookup range starts one row lower than its return range. What is threatened?",
        "Attribute alignment",
        "Only formula length",
        "Only workbook size",
        "Only header color",
        "A matched position can return another record’s value when the two ranges are offset."
      ],
      [
        "A workbook matches text code 007 to number 7 without a business rule. What is needed?",
        "A key representation policy",
        "Only a larger pivot",
        "Only alphabetical sorting",
        "Only a new title",
        "Whether those representations refer to the same entity is a semantic contract, not a display assumption."
      ],
      [
        "A manager wants a terms column added to orders without changing order count. What should lookup validation protect?",
        "Preserve order grain",
        "One row per supplier",
        "A matching total",
        "Nonblank results",
        "The enrichment should preserve the order grain and correctly map each eligible order to its supplier attribute."
      ],
      [
        "A result range is a whole column while keys use only four rows. What requires review?",
        "Aligned ranges",
        "Equal numeric totals",
        "Sorted values",
        "Header text",
        "Key positions must map to intended result rows; mismatched starts or dimensions can return wrong attributes."
      ],
      [
        "A lookup supports wildcard patterns but the input key contains an asterisk. What matters?",
        "Match mode",
        "Case folding",
        "Wildcard matching",
        "Numeric conversion",
        "Literal key matching and pattern interpretation must be chosen deliberately in the target application."
      ],
      [
        "A workbook is shared across Excel and Google Sheets. What should release checks include?",
        "Native application checks",
        "Only the independent Python model",
        "Only a static screenshot",
        "Only a successful file export",
        "Formula availability, syntax and edge-case semantics need verification in each supported application."
      ]
    ],
    "mistakes": [
      "A successful match can still return the wrong attribute.",
      "Exact matching intent should be explicit when using traditional MATCH."
    ],
    "takeaways": [
      "Align keys and result fields by the same records.",
      "Test ordinary matches, missing keys and valid zero results."
    ],
    "lang": "python"
  },
  {
    "id": "sheet-missing",
    "comps": [
      "m2.c2"
    ],
    "title": "Handle missing matches without hiding unrelated errors",
    "intro": "A monthly procurement report has unmatched supplier codes. Replacing every spreadsheet error with zero makes the total appear clean while concealing whether keys are absent, formulas are broken or data is malformed.",
    "sections": [
      [
        "Classify absence before choosing a fallback",
        "A missing key is different from an existing key with a blank attribute and different from an invalid formula reference. In Excel, IFNA can handle #N/A while IFERROR catches a broader class of formula errors. XLOOKUP’s if_not_found argument handles its no-match case but does not establish the right business response to a blank matched result.",
        "Choose a fallback with downstream meaning. Returning \"Missing\" keeps absence visible but mixes text with numeric outputs. Returning zero changes numeric summaries and may imply a real zero. A separate match-status column often lets the report retain a numeric attribute while exposing coverage and routing missing records for correction."
      ],
      [
        "Report match coverage and preserve exceptions",
        "Calculate the number of eligible keys, matched keys and unmatched keys before using enriched results. Review missingness by source and segment because an acceptable overall coverage rate can hide severe gaps in one vendor or region. Do not drop unmatched rows silently if the intended report population includes them.",
        "The fixture distinguishes a missing dictionary key, a matched key with a missing attribute and a matched zero. It reports one unmatched key out of three, keeping all requested keys. The Python model does not implement #N/A propagation, IFNA or IFERROR. Native application review should deliberately trigger distinct formula errors to confirm the chosen handler is narrow enough."
      ]
    ],
    "problem": "Separate key coverage from an empty attribute and a real zero.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "lookup={\"a\":0,\"b\":None}\nkeys=[\"a\",\"b\",\"c\"]\nfor key in keys:\n print(key,\"unmatched\" if key not in lookup else \"blank\" if lookup[key] is None else lookup[key])\nprint(sum(k not in lookup for k in keys),len(keys))",
    "expect": "a 0\nb blank\nc unmatched\n1 3",
    "limit": "Python models three semantic states. It does not execute spreadsheet error codes or certify IFNA/IFERROR behavior.",
    "practice": [
      [
        "What does IFNA target in Excel?",
        "The #N/A error",
        "Every formula error",
        "Only the number zero",
        "Only a blank string",
        "IFNA handles #N/A specifically, allowing unrelated error types to remain visible."
      ],
      [
        "What is match coverage?",
        "Matched keys over eligible keys",
        "The largest returned value",
        "Only the report’s row width",
        "Only the count of columns",
        "Coverage measures how much of the intended lookup population obtained a matching key."
      ],
      [
        "Is a blank matched attribute necessarily an unmatched key?",
        "No",
        "Always",
        "Only for text",
        "Only for dates",
        "Key membership and the contents of the matched attribute are separate states."
      ],
      [
        "A workbook wraps every calculation in IFERROR(...,0). What can be hidden?",
        "Unrelated formula faults",
        "Only large values",
        "Only successful matches",
        "Only date formats",
        "Broad error handling can mask reference, arithmetic or type faults as plausible zero results."
      ],
      [
        "An unmatched supplier is assigned a zero credit limit. What assumption is introduced?",
        "Absence means zero",
        "Absence means a duplicate",
        "Zero proves a match",
        "The formula is exact",
        "A zero fallback is a substantive numeric value and can change decisions about missing suppliers."
      ],
      [
        "A report drops unmatched orders before summing revenue. What may change?",
        "The reporting population",
        "Only column widths",
        "Only header fonts",
        "Only workbook size",
        "Silently removing unmatched rows excludes part of the intended population and can bias totals."
      ],
      [
        "Overall match coverage is high but one supplier feed is mostly missing. What helps?",
        "Segment coverage checks",
        "Only the overall mean",
        "Only a smaller chart",
        "Only an export checksum",
        "Coverage by source or segment reveals concentrated gaps concealed by a high aggregate rate."
      ]
    ],
    "formal": [
      [
        "What distinguishes IFERROR from IFNA?",
        "Broader error handling",
        "Only a shorter name",
        "A guaranteed exact match",
        "A forced numeric result",
        "IFERROR handles multiple error types, while IFNA specifically targets #N/A."
      ],
      [
        "What should a missing-match policy define?",
        "Fallback and follow-up",
        "Only cell fill color",
        "Only a file extension",
        "Only the chart theme",
        "A policy must state how absence is represented and how the underlying issue is resolved."
      ],
      [
        "Which state is a legitimate matched value?",
        "Numeric zero",
        "An absent key by default",
        "Every #REF! error",
        "Only an empty workbook",
        "Zero can be a real attribute value and should not be conflated with a missing key."
      ],
      [
        "A key exists but its payment term is blank. What should status record?",
        "Matched, attribute missing",
        "Unmatched by definition",
        "A valid zero-day term",
        "A duplicate supplier",
        "The key match succeeded, but the required returned information is absent."
      ],
      [
        "A broken reference becomes Missing through IFERROR. What is the problem?",
        "Misclassified fault",
        "Improved match coverage",
        "Guaranteed exact matching",
        "Only a formatting issue",
        "A reference fault is not the same as an absent lookup key and needs separate correction."
      ],
      [
        "A finance report fills unknown prices with zero before totaling. What is at risk?",
        "Understated total value",
        "Only row ordering",
        "Only font consistency",
        "Only matching syntax",
        "Replacing unknown amounts with zero can systematically understate the intended total."
      ],
      [
        "A lookup’s no-match handler works but matched blank cells look like zero. What needs review?",
        "Blank-value behavior",
        "No-match branch",
        "Overall coverage",
        "Positive-value test",
        "The no-match case and the way a native function returns blank attributes need separate tests."
      ],
      [
        "A team reports 98% coverage without showing eligible count. What should be added?",
        "Counts behind the rate",
        "More decimals",
        "Matched value total",
        "Largest supplier rate",
        "The counts reveal the scale of missing records and make the reported proportion interpretable."
      ],
      [
        "A report’s policy excludes unmatched cases for a justified reason. What is necessary?",
        "State exclusions",
        "Keep it implicit",
        "Claim full coverage",
        "Replace with zeros",
        "The population change and its reason must be visible so readers understand the scope of the results."
      ],
      [
        "A workbook must distinguish missing keys, empty attributes and formula faults. Which design helps?",
        "Distinct statuses",
        "One zero fallback",
        "A nonblank flag",
        "Broad IFERROR",
        "Explicit diagnostic states preserve differences that a single fallback value would hide."
      ]
    ],
    "mistakes": [
      "A catch-all error wrapper can turn broken logic into plausible data.",
      "A missing value is not automatically a measured zero."
    ],
    "takeaways": [
      "Track key coverage separately from returned-value completeness.",
      "Use narrow error handling and visible exception states."
    ],
    "lang": "python"
  },
  {
    "id": "sheet-keys",
    "comps": [
      "m2.c1",
      "m2.c2"
    ],
    "title": "Validate duplicate keys and composite lookups",
    "intro": "A supplier master contains historical rows and repeated supplier names. A lookup that returns the first match can appear successful while selecting an arbitrary contract; the key must identify the intended entity and version.",
    "sections": [
      [
        "Determine whether the key is unique at the required grain",
        "A name is often not a stable unique identifier. Check duplicates in the lookup source before enriching orders. A repeated key may represent a data defect, multiple addresses or valid historical versions. Resolve the intended grain rather than deleting repeats blindly. An effective-date lookup requires a version rule beyond an ordinary exact supplier-code search.",
        "Composite keys combine several attributes when no single field is unique. Naive concatenation can collide: AB plus C and A plus BC produce the same text. A delimiter can help only if it is escaped or prohibited in components. Multi-criteria lookup logic or a genuine stable surrogate identifier can avoid fragile string encodings."
      ],
      [
        "Make ambiguity a visible failure",
        "Traditional lookup functions commonly return one matching result according to their search behavior; that does not prove that only one valid source row exists. Define a duplicate policy such as rejecting ambiguous keys for review. Audit normalization and type conversion before checking uniqueness because cleaning may create collisions.",
        "The fixture groups rows by key and permits a return only when exactly one row exists. It also shows a naive composite-key collision. This is an explicit business safeguard modeled in Python, not a claim that XLOOKUP rejects duplicates or that native MATCH returns every duplicate. The workbook implementation should add its own duplicate diagnostics and version-aware matching where needed."
      ]
    ],
    "problem": "Reject ambiguous exact matches and reveal a composite-key collision.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "rows=[(\"s1\",30),(\"s1\",60),(\"s2\",15)]\nfor key in [\"s1\",\"s2\"]:\n values=[v for k,v in rows if k==key]\n print(key,values[0] if len(values)==1 else \"ambiguous\")\nprint(\"AB\"+\"C\"==\"A\"+\"BC\")",
    "expect": "s1 ambiguous\ns2 15\nTrue",
    "limit": "Python implements an authored uniqueness guard. Native spreadsheet lookups may return a duplicate match rather than rejecting it; the guard must be implemented and tested separately.",
    "practice": [
      [
        "What makes a lookup key suitable?",
        "Unique intended identity",
        "Only a short label",
        "Only alphabetical order",
        "Only numeric appearance",
        "A suitable key identifies the intended record at the required grain."
      ],
      [
        "Can a first returned match prove source-key uniqueness?",
        "No",
        "Always",
        "Only for text",
        "Only when formatted",
        "Returning one value does not establish that other matching rows are absent."
      ],
      [
        "What is a composite key?",
        "Several key fields",
        "Only the largest number",
        "A chart annotation",
        "A worksheet name",
        "A composite key identifies records through a combination of attributes."
      ],
      [
        "A supplier code appears with two effective-date versions. What should matching specify?",
        "The intended date version",
        "Only the first row",
        "Only the font color",
        "Only the largest term",
        "Historical rows may both be valid, so the order date and version interval must determine the appropriate contract."
      ],
      [
        "AB plus C and A plus BC produce the same concatenation. What occurred?",
        "A key collision",
        "A successful unique match",
        "A guaranteed missing key",
        "A date conversion",
        "Naive concatenation can collapse different component tuples into the same string."
      ],
      [
        "A team deletes duplicate names but keeps different customer IDs merged. What went wrong?",
        "Wrong identity definition",
        "Only a row-count issue",
        "Only a formatting issue",
        "Only excessive precision",
        "Names may repeat across distinct entities, so deduplication must follow the intended business key and grain."
      ],
      [
        "A cleaning rule uppercases keys and creates repeats. What should happen?",
        "Recheck normalized uniqueness",
        "Assume raw uniqueness holds",
        "Ignore the repeats",
        "Only widen the column",
        "Normalization can merge previously distinct representations and change the lookup contract."
      ]
    ],
    "formal": [
      [
        "What does duplicate-key validation protect?",
        "Unambiguous matching",
        "Only worksheet color",
        "Only formula length",
        "Only a printer setting",
        "Duplicate checks reveal when a supposed key maps to more than one source record."
      ],
      [
        "What can historical duplicate keys represent?",
        "Valid time versions",
        "Always corrupt records",
        "Only blank rows",
        "Only copied headers",
        "Repeated entity keys can be legitimate when separate records describe different effective periods."
      ],
      [
        "What is a key collision?",
        "Different keys collapse",
        "Every key is absent",
        "A formula recalculates",
        "A chart is refreshed",
        "A collision occurs when different input identities receive the same encoded key."
      ],
      [
        "A lookup selects a supplier’s old terms because historical rows come first. What is needed?",
        "A temporal matching rule",
        "Only descending amounts",
        "Only a newer logo",
        "Only a wider workbook",
        "The applicable effective-date version must be selected rather than relying on source ordering."
      ],
      [
        "A user adds a delimiter that can also occur inside fields. What remains possible?",
        "Composite-key ambiguity",
        "Guaranteed unique encoding",
        "Automatic type safety",
        "A verified exact match",
        "Unescaped or unrestricted delimiters can still make different component combinations indistinguishable."
      ],
      [
        "A source promises one row per customer but repeats a key. What should the report do?",
        "Flag the grain violation",
        "Silently choose a value",
        "Average customer IDs",
        "Declare complete coverage",
        "A duplicate violates the one-row-per-customer contract and needs resolution or an explicit revised grain."
      ],
      [
        "A join-like lookup uses customer names instead of stable IDs. What risk increases?",
        "Incorrect entity pairing",
        "Only whitespace normalization",
        "Only alphabetical name sorting",
        "Only a shared row count",
        "Different people can share a name and one person can change names, so names are weak stable identifiers."
      ],
      [
        "An order key is unique before trimming but not afterward. Which check matters for lookup?",
        "Post-cleaning uniqueness",
        "Only pre-cleaning uniqueness",
        "Only the final lookup count",
        "Only the raw-key length",
        "The actual normalized representation used for matching must satisfy the intended uniqueness contract."
      ],
      [
        "A business decides that the latest contract is correct for all current orders. What must be explicit?",
        "Version rule",
        "Silent latest sort",
        "First row wins",
        "Largest return wins",
        "Choosing a latest row is a business rule that should be documented and tested rather than implied by accidental order."
      ],
      [
        "A Python dictionary is built from duplicate keys and loses earlier values. Why is it unsuitable as a duplicate check?",
        "Earlier rows were lost",
        "All rows remain",
        "A match proves uniqueness",
        "Duplicates raise errors",
        "Dictionary construction can overwrite repeated keys, so duplicates must be checked before collapsing to a mapping."
      ]
    ],
    "mistakes": [
      "A first match is not a uniqueness check.",
      "Naive concatenation does not guarantee a unique composite identity."
    ],
    "takeaways": [
      "Validate the key at the required entity and time grain.",
      "Reject or explicitly resolve ambiguous matches."
    ],
    "lang": "python"
  },
  {
    "id": "sheet-pivots",
    "comps": [
      "m3.c1"
    ],
    "title": "Summarize a declared grain with pivot tables",
    "intro": "A manager wants sales by region and product. A pivot table reorganizes source rows into groups and summaries; its output is meaningful only when the source grain and aggregation match the question.",
    "sections": [
      [
        "Choose rows, columns, values and aggregation",
        "A pivot’s row and column fields define grouped categories, while value fields apply summaries such as sum, count or average. A numeric-looking source stored as text can lead to an unexpected count instead of a sum. Inspect the actual aggregation and compare a known group manually rather than trusting the displayed label.",
        "The source should be a rectangular table with one header row, consistent column types and one row per declared observation. Remove embedded subtotals from a transaction source or the pivot can count detail and its subtotal again. A merged header used for presentation is not a substitute for a tidy source column."
      ],
      [
        "Interpret totals under the correct measure",
        "Summing sales is often valid across groups; averaging group rates is not generally equivalent to calculating the overall rate. For weighted measures, preserve their numerators and denominators. Filters and slicers change the included population and must be visible to readers interpreting the totals.",
        "The fixture groups synthetic transaction amounts in Python and calculates both a sum and a count for each region. It models the intended aggregation independently of a native pivot cache. It does not create an Excel PivotTable or Sheets pivot, verify grouping defaults or test slicers. A reviewer should reconcile the real pivot with a known source subset in each target application."
      ]
    ],
    "problem": "Reconcile a pivot-style regional sum with the original transaction total.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "rows=[(\"North\",10),(\"South\",20),(\"North\",15)]\ng={}\nfor region,value in rows:\n g.setdefault(region,[]).append(value)\nprint({k:(sum(v),len(v)) for k,v in sorted(g.items())})\nprint(sum(sum(v) for v in g.values())==sum(v for _,v in rows))",
    "expect": "{'North': (25, 2), 'South': (20, 1)}\nTrue",
    "limit": "Python verifies grouped sums and counts at a transaction grain. Native pivot construction, cache state and application-specific grouping remain unexecuted.",
    "practice": [
      [
        "What do pivot row fields define?",
        "Grouping categories",
        "The largest value",
        "Only cell protection",
        "Only file names",
        "Row fields organize source observations into the categories summarized by the pivot."
      ],
      [
        "What should a value field specify?",
        "An aggregation function",
        "Only a font style",
        "Only the report author",
        "Only a sheet color",
        "The same source field can be summed, counted or averaged, producing different meanings."
      ],
      [
        "What is a rectangular pivot source?",
        "Consistent rows and columns",
        "A decorative merged title",
        "Only a subtotal row",
        "Only a screenshot",
        "A structured table with one header row and consistent fields supports unambiguous grouping and aggregation."
      ],
      [
        "A sales pivot shows counts instead of currency totals. What should be checked?",
        "Type and aggregation",
        "Only chart orientation",
        "Only print margins",
        "Only the report date",
        "Text-stored numbers and the selected summary function can cause counts where sums were intended."
      ],
      [
        "A source contains transaction rows and regional subtotal rows. What risk arises?",
        "Double counting",
        "Automatic deduplication",
        "Guaranteed correct totals",
        "Only a refresh delay",
        "Summing detail together with embedded summaries counts the same underlying value more than once."
      ],
      [
        "An active slicer excludes a region. What should a report disclose?",
        "The filter scope",
        "Only the grand-total font",
        "Only the worksheet name",
        "Only the author’s initials",
        "Filters change the population summarized, so the scope must be visible to the reader."
      ],
      [
        "A total matches but one region is assigned incorrectly. What check helps?",
        "Group reconciliation",
        "Only the final total",
        "Only workbook size",
        "Only row heights",
        "A matching grand total cannot detect values shifted between groups; known-group checks can."
      ]
    ],
    "formal": [
      [
        "Which pivot operation counts source observations?",
        "Count or row count",
        "Sum by definition",
        "Only date grouping",
        "Only refresh",
        "Counting describes the number of records or nonblank values according to the chosen native summary behavior."
      ],
      [
        "What does grouping change?",
        "The output grain",
        "Only the file name",
        "Only the font family",
        "Only source permissions",
        "A summary row represents a category group rather than an individual transaction."
      ],
      [
        "What should a pivot’s displayed units match?",
        "The chosen measure",
        "Only row labels",
        "Only column widths",
        "Only page margins",
        "The units must describe whether the values are currency, counts, rates or another quantity."
      ],
      [
        "A regional sales report needs transaction revenue totals. Which summary fits a clean amount column?",
        "Sum of revenue",
        "Count of revenue cells",
        "Average region names",
        "Maximum customer ID",
        "Summing numeric transaction amounts measures total revenue at the chosen grouping grain."
      ],
      [
        "A pivot averages regional conversion rates with unequal eligible counts. What should be used for an overall rate?",
        "Total cases / eligible",
        "An unweighted mean always",
        "The largest regional rate",
        "Only the first region",
        "The overall rate needs the total numerator divided by total denominator rather than equal weights for unequal groups."
      ],
      [
        "A source has merged multirow headers. What improves pivot reliability?",
        "One explicit header row",
        "More merged cells",
        "Only a smaller font",
        "Only a new chart",
        "A clean rectangular source provides one unambiguous field name per column."
      ],
      [
        "A report hides that canceled orders were filtered out. What is missing?",
        "Population disclosure",
        "Only the grand total",
        "Only the pivot refresh success flag",
        "Only the source row count",
        "Readers need to know which records were included to interpret a reported total or rate."
      ],
      [
        "A pivot total is correct but product totals are wrong after a bad category map. What is needed?",
        "Check category totals",
        "Newer timestamp",
        "Same pivot style",
        "Same subtotal",
        "Misclassification can preserve the grand total while corrupting the grouped business interpretation."
      ],
      [
        "A Python grouping example matches a reference total. What can it establish?",
        "Grouping arithmetic",
        "Cache freshness",
        "Slicer correctness",
        "No hidden filters",
        "The model checks arithmetic and grouping intent but does not execute the pivot engine."
      ],
      [
        "A pivot compares groups with different observation periods. What should the analyst review?",
        "Equal time windows",
        "Equal totals",
        "One row per group",
        "Largest count",
        "Counts over different durations can misrepresent relative demand unless periods or rates are made comparable."
      ]
    ],
    "mistakes": [
      "A pivot’s selected summary function is part of the metric definition.",
      "Matching a grand total does not prove correct category assignment."
    ],
    "takeaways": [
      "Start with a clean rectangular source and declared grain.",
      "Reconcile grouped results as well as overall totals."
    ],
    "lang": "python"
  },
  {
    "id": "sheet-refresh",
    "comps": [
      "m3.c1"
    ],
    "title": "Refresh the source, pivot and evidence in the correct order",
    "intro": "A weekly spreadsheet still shows last week’s revenue after the source file changes. Recalculation, source refresh and pivot refresh are different operations, and none guarantees that new rows are included in a fixed source range.",
    "sections": [
      [
        "Identify the boundaries of freshness",
        "A source refresh retrieves or transforms data; formula recalculation updates dependent cell expressions; pivot refresh updates the pivot’s view or cache from its configured source. The exact user interface depends on Excel version or Sheets. State which applications are supported and test the workflow there rather than assuming identical refresh behavior.",
        "Inspect the source range. A fixed reference such as A1:C100 does not automatically prove that row 101 is included. Structured Excel Tables commonly provide a safer expanding source, but the real pivot and connection must still be configured and tested. Record source watermarks and row counts so the report distinguishes recent refresh time from recent underlying data."
      ],
      [
        "Reconcile before releasing the report",
        "Refresh dependencies in an order that makes newly retrieved data available before summaries are used. Check formula calculation mode where relevant, pivot source coverage, filters and the latest source event. Reconcile counts and totals after adding a known row. A successful refresh command is a technical event, not evidence that the business data is complete or current.",
        "The Python fixture simulates a stale summary snapshot: appending a transaction changes the live source total while the cached value remains unchanged until recomputed. This is a conceptual model only, not an Excel cache implementation or an application refresh test. Human review should add a row beyond the original source boundary and verify its inclusion in the actual workbook."
      ]
    ],
    "problem": "Demonstrate stale summary state and explicit recomputation.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "source=[10,20]\nsnapshot=sum(source)\nsource.append(5)\nprint(snapshot,sum(source))\nsnapshot=sum(source)\nprint(snapshot,len(source))",
    "expect": "30 35\n35 3",
    "limit": "Python models a stale stored aggregate and recomputation. It does not execute Excel RefreshAll, PivotTable.RefreshTable, external connections or Sheets refresh behavior.",
    "practice": [
      [
        "What does formula recalculation update?",
        "Dependent expressions",
        "Every source system",
        "Every external record",
        "All source permissions",
        "Recalculation reevaluates formulas using available inputs and does not itself guarantee a new extraction."
      ],
      [
        "What can a fixed pivot source range miss?",
        "Rows outside its bounds",
        "Only header fonts",
        "Only existing values",
        "Only worksheet colors",
        "New records beyond a fixed source range may remain excluded even after a pivot refresh."
      ],
      [
        "What does a source watermark describe?",
        "Underlying data coverage",
        "Only refresh button time",
        "Only chart dimensions",
        "Only worksheet count",
        "A watermark indicates the source time or position through which data has been observed."
      ],
      [
        "A pivot is refreshed but its source excludes new rows. What should change?",
        "Source coverage",
        "Only the pivot theme",
        "Only the amount format",
        "Only page orientation",
        "Refreshing cannot include records that are outside the configured source."
      ],
      [
        "A file refreshes at noon but the upstream feed stopped yesterday. What is stale?",
        "Underlying source data",
        "Only the display font",
        "Only the pivot field names",
        "Only the workbook title",
        "A recent local refresh does not imply that upstream data is recent or complete."
      ],
      [
        "Excel is in manual calculation mode after inputs change. What needs checking?",
        "Formula recalculation",
        "Only pivot colors",
        "Only row grouping",
        "Only file naming",
        "Dependent formulas may retain prior results until recalculated under the workbook’s mode."
      ],
      [
        "A reviewer adds a row beyond the old last row. What does the test target?",
        "New-row inclusion",
        "Only rounding behavior",
        "Only date parsing",
        "Only chart readability",
        "A boundary row tests whether the configured source and summaries actually expand to include new data."
      ]
    ],
    "formal": [
      [
        "What is a stale summary?",
        "An outdated derived result",
        "Every empty cell",
        "A duplicate header",
        "A current source record",
        "A stored or cached summary can lag changed source values until its update workflow runs."
      ],
      [
        "What should refresh evidence include?",
        "Coverage and totals",
        "Only button clicks",
        "Only a success icon",
        "Only a new file name",
        "Counts, source progress and checked totals establish more than the occurrence of a refresh command."
      ],
      [
        "Why use a known added-row fixture?",
        "Test new-row inclusion",
        "Guarantee causal impact",
        "Avoid all native checks",
        "Replace every source file",
        "A known boundary record lets a reviewer verify that source expansion and summary updates include the intended data."
      ],
      [
        "A report calls Refresh All and immediately exports before an external query finishes. What is at risk?",
        "Unfinished dependencies",
        "Only the chart palette",
        "Only key uniqueness",
        "Only file compression",
        "Downstream summaries may be exported before upstream retrieval and transformation have completed."
      ],
      [
        "A pivot source is an expanding table but a date filter excludes the new month. What needs review?",
        "Filter state",
        "Only table expansion",
        "Only amount formatting",
        "Only the table name",
        "Source inclusion does not ensure display inclusion when a pivot filter still restricts the population."
      ],
      [
        "A successful refresh leaves a formula total unchanged despite a changed input. What should be inspected?",
        "Calculation settings",
        "Only sheet colors",
        "Only author names",
        "Only row heights",
        "Formula recalculation settings and dependency references may prevent the expected downstream update."
      ],
      [
        "A dashboard displays its last local refresh time only. What should be added?",
        "Source watermark",
        "Export timestamp",
        "Button-click time",
        "File-save time",
        "The underlying source coverage time is needed to interpret freshness rather than merely local execution recency."
      ],
      [
        "A weekly report must be reliable across applications. What should validation do?",
        "Native refresh tests",
        "Python totals alone",
        "Workbook opens",
        "Old screenshots",
        "Application-specific connections, cache behavior and source expansion must be exercised in each supported target."
      ],
      [
        "A total increases after refresh but the count doubles unexpectedly. What should happen?",
        "Reconcile the change",
        "Accept the increase",
        "Drop excess rows",
        "Relabel the count",
        "Unexpected count changes can indicate duplicated source rows or altered scope and need diagnosis before release."
      ],
      [
        "A conceptual Python cache model passes. What remains an explicit review item?",
        "Workbook refresh",
        "Pivot cache passed",
        "Connections passed",
        "Python sum only",
        "The model demonstrates stale-state logic without testing the application’s actual refresh and dependency behavior."
      ]
    ],
    "mistakes": [
      "A refresh timestamp does not establish source freshness.",
      "Refreshing a pivot does not repair an incomplete source range."
    ],
    "takeaways": [
      "Track upstream coverage, range inclusion and dependency order.",
      "Test refresh with known boundary records in the target application."
    ],
    "lang": "python"
  },
  {
    "id": "sheet-cleaning",
    "comps": [
      "m3.c2"
    ],
    "title": "Create an auditable cleaning pipeline and reconcile the result",
    "intro": "A sales workbook receives repeated CSV exports with extra spaces, malformed amounts and duplicate transaction IDs. A reliable cleaning process preserves raw inputs, records exceptions and produces a reproducible table for analysis.",
    "sections": [
      [
        "Treat cleaning as a sequence of explicit transformations",
        "Separate raw input, cleaned values and analysis outputs. Define required fields, column types, locale for number/date parsing and the transaction key. A formula-based cleaning pipeline can use helper columns with visible status flags; a Power Query workflow can record transformation steps, but that tool’s actual behavior still needs application review.",
        "Do not treat errors as instructions to delete records. A malformed amount may require source correction, while a missing optional note may be acceptable. Duplicate transaction IDs can mean repeated exports or valid multi-line orders; resolve the declared grain before deduplicating. Keep rejected rows with reasons so their impact on counts and totals is known."
      ],
      [
        "Reconcile transformations and preserve repeatability",
        "Measure input rows, accepted rows, rejected rows, duplicate groups and newly missing values. The counts should reconcile according to the stated pipeline. Record whether a filter removed invalid rows or whether duplicates were consolidated before or after validation, since the order can change outcomes.",
        "The fixture models a deliberately narrow policy: trim ordinary surrounding spaces from an ID, parse a decimal amount, reject bad amounts and repeated IDs, then sum accepted amounts exactly. Python Decimal is used for the model’s monetary arithmetic; it is not a claim about Excel’s numeric storage or Power Query types. The target workbook must implement and verify its own transformations and rounding policy."
      ]
    ],
    "problem": "Audit accepted, malformed and duplicate records under an explicit policy.",
    "steps": [
      "Define the population, units and decision before calculating.",
      "Run the synthetic fixture and inspect intermediate values against its declared contract.",
      "Explain the result, boundary conditions and the action that the evidence supports."
    ],
    "code": "from decimal import Decimal,InvalidOperation\nraw=[(\" a \",\"10.20\"),(\"b\",\"bad\"),(\"a\",\"10.20\"),(\"c\",\"5.30\")]\nseen=set();accepted=[];rejected=[]\nfor key,text in raw:\n key=key.strip()\n try: value=Decimal(text)\n except InvalidOperation:\n  rejected.append((key,\"amount\"));continue\n if key in seen:\n  rejected.append((key,\"duplicate\"));continue\n seen.add(key);accepted.append((key,value))\nprint(len(raw),len(accepted),len(rejected))\nprint(sum(v for _,v in accepted))\nprint(rejected)",
    "expect": "4 2 2\n15.50\n[('b', 'amount'), ('a', 'duplicate')]",
    "limit": "Python verifies this stated cleaning policy with Decimal and explicit rejection reasons. It does not run Excel formulas or Power Query, validate real exports or prove that dropping duplicates is the correct business policy.",
    "practice": [
      [
        "Why retain raw input?",
        "Audit transformations",
        "Guarantee no errors",
        "Avoid all validation",
        "Increase totals",
        "Raw values let reviewers trace cleaning effects and resolve incorrect transformation assumptions."
      ],
      [
        "What should rejected rows retain?",
        "A reason and identity",
        "Only a blank row",
        "Only a new color",
        "Only a final total",
        "Exception records need enough identity and explanation to support correction and coverage review."
      ],
      [
        "What defines valid deduplication?",
        "The intended record grain",
        "Only equal text labels",
        "Only source sort order",
        "Only a newer file name",
        "Duplicates must be interpreted against what one row represents, such as a transaction or an order line."
      ],
      [
        "A parser turns malformed amounts into blanks without counting them. What is hidden?",
        "New missingness",
        "Only the file size",
        "Only column order",
        "Only the report date",
        "Silent coercion removes observed representations and can change totals or denominators without visibility."
      ],
      [
        "Two order rows share an order ID but have different line items. Can one be deleted automatically?",
        "No; inspect the grain",
        "Yes; IDs always deduplicate",
        "Only the larger row stays",
        "Only the first line is valid",
        "At an order-line grain, repeated order IDs may be legitimate and need a composite line key."
      ],
      [
        "A cleaning process drops 20 rows and reports no exceptions. What should be added?",
        "A reconciliation ledger",
        "Only a larger title",
        "Only row shading",
        "Only the output file name",
        "Counts and rejection reasons are needed to explain the population lost through cleaning."
      ],
      [
        "A Python Decimal total is correct. Does that prove Excel numeric rounding matches it?",
        "No native rounding check",
        "Yes for every workbook",
        "Only for large amounts",
        "Only for zeros",
        "Decimal arithmetic and spreadsheet numeric representations differ, so workbook rounding needs its own policy and verification."
      ],
      [
        "A source amount fails parsing after a refresh. What should the workbook preserve for correction?",
        "Raw value and failure status",
        "Only a numeric zero",
        "Only the latest total",
        "Only the visible cell format",
        "Retaining the raw representation and a reason lets reviewers correct the source and assess analytical coverage."
      ]
    ],
    "formal": [
      [
        "What is a cleaning pipeline?",
        "Ordered cleaning rules",
        "Only a chart gallery",
        "A random manual edit",
        "Only a printed report",
        "A pipeline defines repeatable steps from raw inputs to a validated analytical representation."
      ],
      [
        "What is a schema check?",
        "Expected fields and types",
        "Only sort row values",
        "Only resize columns",
        "Only choose chart colors",
        "Schema validation checks whether the received structure and representations match the consumer’s contract."
      ],
      [
        "What should row-count reconciliation explain?",
        "All retained and lost rows",
        "Only the final chart size",
        "Only the largest value",
        "Only the workbook author",
        "Reconciliation connects input records to accepted, rejected and otherwise transformed outputs under the policy."
      ],
      [
        "A CSV adds an unexpected currency field and changes amount text formatting. What should happen?",
        "Review schema and parsing",
        "Silently keep old assumptions",
        "Only rename the worksheet",
        "Only hide the new field",
        "A changed source contract can alter meaning and parsing and must be inspected before trusting the totals."
      ],
      [
        "A user manually edits the cleaned sheet after each refresh. What weakens repeatability?",
        "Unrecorded transformations",
        "Only large input volume",
        "Only a wide workbook",
        "Only the table’s color",
        "Manual changes outside a recorded rule set may be lost or applied inconsistently on rerun."
      ],
      [
        "A pipeline rejects duplicate IDs before parsing amounts. Why record the step order?",
        "Order can affect outcomes",
        "Order never matters",
        "Only the filename changes",
        "Only formatting changes",
        "A malformed first occurrence can interact with duplicate selection, so transformation sequence is part of the contract."
      ],
      [
        "A team deletes every row with a blank optional note. What should be challenged?",
        "Row rejection rule",
        "Note blankness only",
        "Accepted share only",
        "Visual tidiness",
        "Missing optional information may not justify excluding otherwise valid transactions from analysis."
      ],
      [
        "A source rerun repeats yesterday’s transactions. What key check helps?",
        "Stable transaction identity",
        "Only the export file timestamp",
        "Only amount equality",
        "Only worksheet row position",
        "Stable identifiers can reveal replayed records while distinguishing genuine different transactions with equal amounts."
      ],
      [
        "A cleaning dashboard shows only accepted totals. What else supports review?",
        "Rejection ledger",
        "Accepted total",
        "Largest rejection",
        "Refresh success",
        "Reviewers need the scale and nature of exceptions to judge coverage and potential bias."
      ],
      [
        "A Power Query step list is documented but not executed here. What should metadata say?",
        "Native review pending",
        "Native run passed",
        "Human approval given",
        "Ready to publish",
        "Documentation and a Python model do not replace testing the actual transformation engine or human educational review."
      ]
    ],
    "mistakes": [
      "Deleting duplicates without a grain rule can remove legitimate detail.",
      "A clean-looking total can hide excluded or malformed source records."
    ],
    "takeaways": [
      "Make cleaning rules explicit and repeatable.",
      "Reconcile accepted and rejected evidence before analysis."
    ],
    "lang": "python"
  }
];
module.exports=course('spreadsheet-analysis',specs,[
  {
    "id": "excel-recalculation",
    "title": "Official Excel recalculation and dependency guidance",
    "url": "https://github.com/MicrosoftDocs/office-developer-client-docs/blob/eedbd61ca40689e7cfed5e1cfd9440a9dc3ab7a5/docs/excel/excel-recalculation.md",
    "source": {
      "repo": "MicrosoftDocs/office-developer-client-docs",
      "commit": "eedbd61ca40689e7cfed5e1cfd9440a9dc3ab7a5",
      "path": "docs/excel/excel-recalculation.md",
      "verification": "Pinned official source inspected during authoring; original business reasoning and synthetic examples require human educational review."
    }
  },
  {
    "id": "excel-sumifs",
    "title": "Official Excel WorksheetFunction.SumIfs reference; VBA API examples are not worksheet-engine execution",
    "url": "https://github.com/MicrosoftDocs/VBA-Docs/blob/cfee1b35b419270636defdbee0ac96e5ded071bb/api/Excel.WorksheetFunction.SumIfs.md",
    "source": {
      "repo": "MicrosoftDocs/VBA-Docs",
      "commit": "cfee1b35b419270636defdbee0ac96e5ded071bb",
      "path": "api/Excel.WorksheetFunction.SumIfs.md",
      "verification": "Pinned official source inspected during authoring; original business reasoning and synthetic examples require human educational review."
    }
  },
  {
    "id": "excel-countifs",
    "title": "Official Excel WorksheetFunction.CountIfs reference; VBA API examples are not worksheet-engine execution",
    "url": "https://github.com/MicrosoftDocs/VBA-Docs/blob/cfee1b35b419270636defdbee0ac96e5ded071bb/api/Excel.WorksheetFunction.CountIfs.md",
    "source": {
      "repo": "MicrosoftDocs/VBA-Docs",
      "commit": "cfee1b35b419270636defdbee0ac96e5ded071bb",
      "path": "api/Excel.WorksheetFunction.CountIfs.md",
      "verification": "Pinned official source inspected during authoring; original business reasoning and synthetic examples require human educational review."
    }
  },
  {
    "id": "excel-match",
    "title": "Official Excel WorksheetFunction.Match reference; VBA API examples are not worksheet-engine execution",
    "url": "https://github.com/MicrosoftDocs/VBA-Docs/blob/cfee1b35b419270636defdbee0ac96e5ded071bb/api/Excel.WorksheetFunction.Match.md",
    "source": {
      "repo": "MicrosoftDocs/VBA-Docs",
      "commit": "cfee1b35b419270636defdbee0ac96e5ded071bb",
      "path": "api/Excel.WorksheetFunction.Match.md",
      "verification": "Pinned official source inspected during authoring; original business reasoning and synthetic examples require human educational review."
    }
  },
  {
    "id": "excel-index",
    "title": "Official Excel WorksheetFunction.Index reference; VBA API examples are not worksheet-engine execution",
    "url": "https://github.com/MicrosoftDocs/VBA-Docs/blob/cfee1b35b419270636defdbee0ac96e5ded071bb/api/Excel.WorksheetFunction.Index.md",
    "source": {
      "repo": "MicrosoftDocs/VBA-Docs",
      "commit": "cfee1b35b419270636defdbee0ac96e5ded071bb",
      "path": "api/Excel.WorksheetFunction.Index.md",
      "verification": "Pinned official source inspected during authoring; original business reasoning and synthetic examples require human educational review."
    }
  },
  {
    "id": "excel-trim",
    "title": "Official Excel WorksheetFunction.Trim reference; VBA API examples are not worksheet-engine execution",
    "url": "https://github.com/MicrosoftDocs/VBA-Docs/blob/cfee1b35b419270636defdbee0ac96e5ded071bb/api/Excel.WorksheetFunction.Trim.md",
    "source": {
      "repo": "MicrosoftDocs/VBA-Docs",
      "commit": "cfee1b35b419270636defdbee0ac96e5ded071bb",
      "path": "api/Excel.WorksheetFunction.Trim.md",
      "verification": "Pinned official source inspected during authoring; original business reasoning and synthetic examples require human educational review."
    }
  },
  {
    "id": "excel-clean",
    "title": "Official Excel WorksheetFunction.Clean reference; VBA API examples are not worksheet-engine execution",
    "url": "https://github.com/MicrosoftDocs/VBA-Docs/blob/cfee1b35b419270636defdbee0ac96e5ded071bb/api/Excel.WorksheetFunction.Clean.md",
    "source": {
      "repo": "MicrosoftDocs/VBA-Docs",
      "commit": "cfee1b35b419270636defdbee0ac96e5ded071bb",
      "path": "api/Excel.WorksheetFunction.Clean.md",
      "verification": "Pinned official source inspected during authoring; original business reasoning and synthetic examples require human educational review."
    }
  },
  {
    "id": "excel-pivot-refresh",
    "title": "Official Excel PivotTable.RefreshTable reference; VBA API examples are not worksheet-engine execution",
    "url": "https://github.com/MicrosoftDocs/VBA-Docs/blob/cfee1b35b419270636defdbee0ac96e5ded071bb/api/Excel.PivotTable.RefreshTable.md",
    "source": {
      "repo": "MicrosoftDocs/VBA-Docs",
      "commit": "cfee1b35b419270636defdbee0ac96e5ded071bb",
      "path": "api/Excel.PivotTable.RefreshTable.md",
      "verification": "Pinned official source inspected during authoring; original business reasoning and synthetic examples require human educational review."
    }
  }
]);
