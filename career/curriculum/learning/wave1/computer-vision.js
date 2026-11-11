'use strict';
const {course}=require('./wave4-ai-mobile-completion-private');
module.exports=course("computer-vision",[
  {
    "slug": "pixel-contract",
    "title": "Represent pixels, channels and normalization",
    "intro": "A parcel-inspection model receives RGB camera frames. An image tensor carries both numbers and a contract: color order, height, width, scale and channel statistics. Completing deep-learning first supplies tensor and loss vocabulary; here we make the image-specific assumptions explicit before fitting a classifier.",
    "sections": [
      [
        "Decode before learning",
        "A pixel is a sampled measurement at a spatial coordinate. Grayscale has one intensity channel; RGB has red, green and blue channels. A decoded array often uses HWC order, while ordinary batched PyTorch Conv2d uses NCHW. Permuting axes changes indexing; reshaping without moving values does not correctly convert HWC into CHW. Batch size is a count of images, not an additional color channel.",
        "Convert unsigned integer samples to floating point before arithmetic. Scaling an 8-bit channel by 255 maps its nominal range into [0,1]; this is distinct from standardization z=(x-mean)/std. If the trained contract expects RGB standardized with recorded channel statistics, serving must repeat that order. Computing statistics on a combined training and evaluation collection leaks information across the measurement boundary."
      ],
      [
        "Validate semantics at ingestion",
        "Write a known-color probe: a pure red pixel must activate the red coordinate after conversion. A shape test alone cannot detect RGB/BGR reversal. Persist decoding, EXIF orientation policy and channel order beside the model artifact. Handle unsupported or corrupt inputs with an explicit error rather than quietly producing a black image.",
        "The worked fixture converts two synthetic pixels from HWC into NCHW and standardizes the red channel. Reading the first pixel by hand gives (1-.5)/.5=1. The second pixel gives (0-.5)/.5=-1. Production color management and image codecs are outside this arithmetic check. In a warehouse, this contract protects against a camera replacement silently changing the feature semantics."
      ]
    ],
    "code": "import torch\nx=torch.tensor([[[255,0,0],[0,255,0]]],dtype=torch.uint8)\ny=x.permute(2,0,1).unsqueeze(0).float()/255\nz=(y-.5)/.5\nprint(list(y.shape))\nprint(z[0,0,0].tolist())",
    "expect": "[1, 3, 1, 2]\n[1.0, -1.0]",
    "practice": [
      [
        "Which axis in NCHW counts image examples?",
        "N",
        "C counts image examples",
        "H counts image examples",
        "W counts image examples",
        "N indexes independent images; C indexes channels within each image."
      ],
      [
        "What operation moves HWC channels into CHW order?",
        "Axis permutation",
        "Reshape without reordering",
        "Sort all pixel magnitudes",
        "Remove the width dimension",
        "A permutation moves the channel axis while retaining pixel correspondence."
      ],
      [
        "What does dividing 8-bit samples by 255 establish?",
        "Unit interval scale",
        "Zero mean on every dataset",
        "Equal variance in channels",
        "Corrected class imbalance",
        "Nominal integer endpoints map to zero and one; this is not standardization."
      ],
      [
        "A camera starts emitting BGR into an RGB model. Which probe best exposes this?",
        "Known-color pixel test",
        "Batch-count assertion only",
        "File-size histogram alone",
        "Optimizer-state checksum",
        "A known-color probe checks channel meaning rather than merely tensor shape."
      ],
      [
        "A saved contract has mean .4 and std .2. How should normalized .6 be transformed?",
        "1.0",
        "0.2",
        "3.0",
        "5.0",
        "Subtract .4 then divide by .2 to obtain one standardized unit."
      ],
      [
        "A service receives an unreadable scan. Which response preserves its input contract?",
        "Explicit decode failure",
        "Silently label a black image",
        "Pretend the request succeeded",
        "Use its filename as pixels",
        "A decode failure must remain distinguishable from an authentic dark image."
      ]
    ],
    "formal": [
      [
        "What is a channel in an RGB image?",
        "One color component",
        "Training epoch",
        "Image target",
        "Update rule",
        "RGB stores three color components at each spatial location."
      ],
      [
        "Which image layout is the ordinary batched Conv2d input?",
        "NCHW",
        "NHWC",
        "HWCN",
        "NCWH",
        "The standard batched input axes are batch, channels, height and width."
      ],
      [
        "A pixel has value 128 in an 8-bit channel. Which scaling expresses its unit-interval value?",
        "128/255",
        "128/256 only",
        "128 minus 255",
        "255 divided by 128",
        "The declared endpoint-preserving scale divides by the maximum value 255."
      ],
      [
        "An ingestion engineer uses reshape to turn HWC into CHW. Which defect can remain despite matching shape?",
        "Mixed pixel-channel meaning",
        "Too many optimizer steps",
        "Missing model output bias",
        "Incorrect target class count",
        "Reshape can preserve an incorrect ordering of elements; permuting axes preserves the intended correspondence."
      ],
      [
        "An RGB model receives a red probe and produces channel vector (0,0,1). What is implicated?",
        "Channel-order reversal",
        "Image count doubled",
        "Cross-entropy reduction",
        "Learning rate too large",
        "A pure red probe should occupy the first RGB coordinate, so the observed vector exposes a semantic input mismatch."
      ],
      [
        "A normalized channel is .75 with mean .5 and std .25. What standardized input should serving supply?",
        "1",
        ".25",
        "3",
        "2",
        "Standardization subtracts the recorded mean then divides by the recorded standard deviation."
      ],
      [
        "A batch has 16 RGB images of 20 by 30 pixels. Which tensor contract is correct?",
        "Shape (16,3,20,30)",
        "Shape (3,16,20,30)",
        "Shape (16,20,30,3)",
        "Shape (16,3,30,20)",
        "NCHW preserves image count, color channels, height and width in that order."
      ],
      [
        "A training pipeline uses x/255 then (x-.5)/.5; serving only uses x/255. For raw 0, which pair reaches the model?",
        "Train -1; serve 0",
        "Train 0; serve -1",
        "Train 0; serve .5",
        "Train .5; serve 0",
        "The missing standardization moves black from minus one to zero, violating the learned input contract."
      ],
      [
        "A team estimates channel means using every image before holding out customers. Which repair protects evaluation?",
        "Train-only statistics",
        "Test-only statistics",
        "Per-test-label statistics",
        "Customer-id features",
        "Statistics are fitted preprocessing and must respect the training boundary."
      ],
      [
        "A model must match training RGB semantics after a decoder change. Which release plan provides relevant evidence?",
        "Color and output probes",
        "Shape and speed checks",
        "File-size and hash checks",
        "Label and optimizer checks",
        "Known-color and end-to-end parity checks test semantics that a shape-only check cannot establish."
      ]
    ],
    "steps": [
      "Create one row of two known RGB pixels.",
      "Permute channels, add batch and scale values.",
      "Calculate the red standardized values and compare the printed tensor."
    ],
    "mistakes": [
      "Do not replace an axis permutation with a reshape.",
      "Do not recompute serving statistics independently of the trained contract."
    ],
    "takeaways": [
      "Pixel meaning includes scale and color order.",
      "Verify a known-color case as well as tensor shape."
    ],
    "lang": "python-torch",
    "problem": "Represent pixels, channels and normalization on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness."
  },
  {
    "slug": "resize-annotations",
    "title": "Resize images without corrupting spatial targets",
    "intro": "A retail detector locates price tags using half-open boxes (x1,y1,x2,y2). Resizing pixels without transforming annotations creates wrong training targets. This lesson separates interpolation of measured image values from transformation of coordinates and categorical masks.",
    "sections": [
      [
        "Geometry is part of the label",
        "For a direct resize from width W and height H to Wnew and Hnew, multiply x coordinates by Wnew/W and y coordinates by Hnew/H. Half-open boxes have area (x2-x1)(y2-y1); do not add one to their widths. If a pipeline adds letterbox padding after scaling, add the horizontal and vertical offsets to both corresponding endpoints. Undo the operations in reverse order when mapping predictions back.",
        "Anisotropic resizing changes aspect ratio; letterboxing preserves shape proportions but introduces padding. Both can be valid contracts when training and inference agree. A crop translates coordinates then clips to its window; boxes with no remaining area need an explicit removal policy. Coordinate transforms must follow the same random crop sampled for the image."
      ],
      [
        "Pixels and discrete labels need different interpolation",
        "Bilinear interpolation estimates continuous image intensities between sample centers. A class-index segmentation mask stores category ids, so interpolating it as though ids were measurements can invent categories. Use a documented nearest-neighbor policy for categorical masks, keeping its coordinate convention fixed. Nearest and nearest-exact are different implementation modes; compare fixtures when changing a resize library.",
        "The example doubles horizontal box coordinates and halves vertical ones, then resizes a tiny integer-valued mask with nearest interpolation. It verifies geometry and preserved category values, not a complete image decoding library. For shelf analytics, accidentally moving boxes off their objects can look like a model-capacity problem; inspect an overlaid transformed target before tuning the network."
      ]
    ],
    "code": "import torch\nimport torch.nn.functional as F\nb=torch.tensor([2.,4.,6.,8.])\nprint((b*torch.tensor([2.,.5,2.,.5])).tolist())\nm=torch.tensor([[[[0.,2.],[2.,0.]]]])\nr=F.interpolate(m,size=(4,4),mode='nearest')\nprint(sorted(r.unique().tolist()))",
    "expect": "[4.0, 2.0, 12.0, 4.0]\n[0.0, 2.0]",
    "practice": [
      [
        "What does a half-open box width equal?",
        "x2 minus x1",
        "x2 minus x1 plus one",
        "x1 plus x2 always",
        "Twice the center x",
        "Half-open coordinate intervals measure extent without an inclusive-endpoint correction."
      ],
      [
        "Which interpolation avoids inventing categorical mask ids?",
        "Nearest neighbor",
        "Bilinear averaging of ids",
        "Bicubic blending of ids",
        "Mean across every image",
        "Nearest-neighbor sampling selects existing categorical values."
      ],
      [
        "What extra geometric operation does letterboxing add after scaling?",
        "Padding translation",
        "Class-id renumbering",
        "Channel standardization",
        "Confidence thresholding",
        "Padding offsets translate coordinates after the scale has been applied."
      ],
      [
        "A 100-wide frame becomes 200 wide. What happens to box x=30?",
        "It becomes 60",
        "It remains 30",
        "It becomes 15",
        "It becomes 130",
        "Horizontal coordinates multiply by the width ratio of two."
      ],
      [
        "A crop removes the entire object box. What target action is required?",
        "Remove that box",
        "Keep its original area",
        "Set confidence to one",
        "Move it to the image center",
        "An annotation with no visible area must follow a declared removal rule."
      ],
      [
        "A mask resize produces id 1 between ids 0 and 2. What likely went wrong?",
        "Continuous interpolation",
        "Correct class remapping",
        "Pure axis permutation",
        "Loss reduction mismatch",
        "Blending category numbers can create an id absent from the source mask."
      ]
    ],
    "formal": [
      [
        "What geometric quantity changes under a nonuniform resize?",
        "Object aspect ratio",
        "Class dictionary",
        "Batch meaning",
        "Label count",
        "Different horizontal and vertical scale factors distort relative shape."
      ],
      [
        "How should x coordinates transform under direct resizing?",
        "Multiply by width ratio",
        "Multiply by height ratio",
        "Add output image width",
        "Subtract input image width",
        "Horizontal positions scale with the change in image width."
      ],
      [
        "Which representation calls for category-preserving interpolation?",
        "Class-index mask",
        "RGB pixels",
        "Depth field",
        "Thermal field",
        "Category ids name classes rather than continuous measurements."
      ],
      [
        "A 640 by 480 frame becomes 320 by 240. Box (100,80,300,200) becomes what?",
        "(50,40,150,100)",
        "(50,80,150,200)",
        "(100,40,300,100)",
        "(200,160,600,400)",
        "Both dimensions are halved, so all four endpoint coordinates are halved."
      ],
      [
        "A crop starts at (20,10). Original box is (30,20,60,40) and remains visible. Which cropped box is valid?",
        "(10,10,40,30)",
        "(50,30,80,50)",
        "(30,20,60,40)",
        "(20,10,50,30)",
        "Subtract the crop origin from each corresponding endpoint before clipping."
      ],
      [
        "An image is scaled by .5 then padded 10 horizontally and 20 vertically. Where does point (100,60) land?",
        "(60,50)",
        "(55,40)",
        "(110,80)",
        "(50,30)",
        "Scale gives (50,30); adding padding gives (60,50)."
      ],
      [
        "A detection from that padded pipeline lies at (60,50). Which inverse sequence recovers (100,60)?",
        "Subtract padding, divide scale",
        "Divide scale, subtract padding",
        "Add padding, multiply scale",
        "Multiply scale, add padding",
        "Inverting a composition requires undoing translation before undoing scaling."
      ],
      [
        "A box width is 20 and height 10 before x-scale 2 and y-scale .5. What is its new area?",
        "200",
        "400",
        "100",
        "800",
        "The new width is 40 and height is five, preserving area under determinant one."
      ],
      [
        "A training crop moves image pixels but its boxes use a different random crop draw. Which evidence should block training?",
        "Misaligned target overlay",
        "Compatible tensor dimensions",
        "Unchanged dataset row count",
        "Valid integer target values",
        "Image and annotation transforms must share the same sampled geometric parameters."
      ],
      [
        "A team replaces nearest mask resizing with bilinear and rounds ids; classes are 0 and 4. Which plan preserves the label contract?",
        "Keep categorical sampling",
        "Round interpolated values",
        "Train on generated ids 1-3",
        "Treat class ids as RGB",
        "Rounding interpolated ids can still invent categories, so category-preserving sampling is required."
      ]
    ],
    "steps": [
      "Scale each box endpoint by its corresponding axis ratio.",
      "Resize the mask with nearest-neighbor selection.",
      "Verify the transformed coordinates and unchanged mask class set."
    ],
    "mistakes": [
      "Do not add one when using half-open areas.",
      "Do not interpolate class ids as continuous pixel values."
    ],
    "takeaways": [
      "Transform targets alongside their source images.",
      "Invert padding before scaling predictions back."
    ],
    "lang": "python-torch",
    "problem": "Resize images without corrupting spatial targets on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness."
  },
  {
    "slug": "augmentation-splits",
    "title": "Design task-valid augmentation and leakage-safe image splits",
    "intro": "A factory has repeated camera frames of the same part. Randomly splitting individual frames makes evaluation optimistic because near-identical objects appear on both sides. Augmentation can improve robustness only when its transformations preserve the task labels and stay inside the training boundary.",
    "sections": [
      [
        "Split by the source of dependence",
        "The independent unit might be a patient, manufactured part, video session or store visit. Choose a group key representing that source before separating train and evaluation data. A temporal holdout is additionally useful when future operation differs from historical capture. Duplicate-image hashes are helpful but cannot replace group reasoning: two photographs of the same part may have different bytes.",
        "Augmentation creates modified training examples. A horizontal flip can preserve a generic animal label yet change left-versus-right anatomy or the meaning of text. Rotations, crops and color perturbations need a label-invariance argument tied to the use case. Validation should ordinarily use a stable preprocessing policy; test-time augmentation is a separate, documented inference method with its own cost and aggregation rule."
      ],
      [
        "Synchronize transformations and record the boundary",
        "For an image of width W, a half-open box (x1,x2) under horizontal flipping becomes (W-x2,W-x1). Segmentation masks must flip along the same spatial axis. Photometric jitter may change the image without changing geometry, but a geometry operation requires a shared target transform. Seeded generators make a local experiment reproducible; they do not prove the chosen transforms are representative.",
        "The fixture checks that no declared group crosses the boundary and computes a flipped box analytically. In a quality-control business, rejecting a defective part twice from correlated frames is not evidence of success on two independent parts. Report both the group protocol and the effective sample counts; preserve a final untouched evaluation set after choosing augmentation strength."
      ]
    ],
    "code": "import torch\ntrain={'part-a','part-b'}\nvalid={'part-c'}\nb=torch.tensor([2.,1.,6.,4.])\nw=10\nflipped=torch.tensor([w-b[2],b[1],w-b[0],b[3]])\nprint(bool(train.isdisjoint(valid)))\nprint(flipped.tolist())",
    "expect": "True\n[4.0, 1.0, 8.0, 4.0]",
    "practice": [
      [
        "What should define a split when repeated frames share a patient?",
        "Patient group",
        "Each compressed file byte",
        "Each random crop position",
        "Each model output channel",
        "Patients are the dependent sampling units, so patient groups must stay together."
      ],
      [
        "What is the purpose of label-preserving augmentation?",
        "Vary valid training inputs",
        "Create independent test labels",
        "Guarantee perfect calibration",
        "Eliminate the need for splits",
        "Augmentation explores task-valid input variation while retaining valid supervision."
      ],
      [
        "What does a fixed random seed establish locally?",
        "Repeatable random draws",
        "Representative deployment data",
        "Independent patient samples",
        "Correct class definitions",
        "A seed controls a random sequence, not the suitability of its assumptions."
      ],
      [
        "A plate-reading team proposes arbitrary horizontal flips. What needs review?",
        "Text-label validity",
        "Only image byte size",
        "Only batch sequence length",
        "Only optimizer selection",
        "Flipping written text can invalidate a transcription label."
      ],
      [
        "A video benchmark randomly separates adjacent frames. Which change addresses the key leakage risk?",
        "Split recording sessions",
        "Shuffle frames more often",
        "Double augmentation count",
        "Increase image resolution",
        "Holding out sessions reduces near-duplicate temporal leakage."
      ],
      [
        "A flip changes image geometry but leaves segmentation targets untouched. What is corrupted?",
        "Pixel-target alignment",
        "Number of color channels",
        "Loss reduction setting",
        "Saved optimizer moments",
        "The mask must share the same spatial transformation as the image."
      ]
    ],
    "formal": [
      [
        "Which property must a supervised augmentation preserve?",
        "Target validity",
        "File equality",
        "All activations",
        "Sample order",
        "A useful augmentation changes inputs while keeping their supervision correct."
      ],
      [
        "What leakage boundary matters for correlated captures?",
        "Source groups",
        "Filename order",
        "Checkpoint bytes",
        "Loader workers",
        "Correlated samples from one source can inflate evaluation when split across boundaries."
      ],
      [
        "Why keep development evaluation deterministic by default?",
        "Comparable model selection",
        "Guaranteed absence of drift",
        "Automatic class balance",
        "Higher training sample count",
        "Stable evaluation preprocessing makes comparisons less confounded by random transforms."
      ],
      [
        "A 12-wide image has box x endpoints (3,8). What are flipped endpoints?",
        "(4,9)",
        "(9,4)",
        "(3,8)",
        "(5,10)",
        "Half-open horizontal coordinates become (W-x2,W-x1), giving (4,9)."
      ],
      [
        "A hospital has ten images per patient and random image splits. Which estimate is most compromised?",
        "New-patient performance",
        "Training-loss arithmetic",
        "Parameter-count arithmetic",
        "RGB-channel compatibility",
        "Patient identity and shared capture details can leak across the image-level split."
      ],
      [
        "A pipeline crops images and masks using separate generators. What immediate diagnostic is most relevant?",
        "Target overlays",
        "Training file counts",
        "GPU logs",
        "State hashes",
        "Separate crop draws can break correspondence; overlays directly expose the geometric mismatch."
      ],
      [
        "A dataset has train groups {A,B,C} and test groups {C,D}. Which overlap must be resolved?",
        "Group C",
        "Only group D",
        "Only groups A and B",
        "No groups overlap",
        "Group C crosses the stated independence boundary and invalidates that group holdout."
      ],
      [
        "A crop retains 2% of a labeled object while keeping the full-image positive label. Which plan is technically justified?",
        "Visibility policy",
        "Keep all crops",
        "Drop negatives",
        "Use test labels",
        "The task needs a minimum visibility or relabeling policy to keep training supervision meaningful."
      ],
      [
        "A team tries 40 augmentation settings on its final test set and reports the best. What should happen next?",
        "Untouched evaluation",
        "Report best only",
        "Average scores",
        "Rename the test",
        "Repeated selection on the final test set turns it into development data."
      ],
      [
        "A model will see new factories and future weeks; near-duplicates share part ids. Which protocol best tests that claim?",
        "Group/time holdouts",
        "Random frames",
        "Random pixels",
        "More crops",
        "The evaluation must reflect both source dependence and the future-use boundary."
      ]
    ],
    "steps": [
      "Check disjoint part groups before any augmentation.",
      "Compute mirrored half-open endpoints for the synthetic box.",
      "Compare invariants: unchanged width and preserved target alignment."
    ],
    "mistakes": [
      "Do not confuse more augmented frames with more independent parts.",
      "Do not choose augmentation parameters using final evaluation labels."
    ],
    "takeaways": [
      "Split according to deployment independence.",
      "Require a task-specific invariance argument for each augmentation."
    ],
    "lang": "python-torch",
    "problem": "Design task-valid augmentation and leakage-safe image splits on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness."
  },
  {
    "slug": "convolution-trace",
    "title": "Trace convolution, shape and parameter sharing",
    "intro": "A visual defect detector needs to recognize local edges at many image positions. Convolutional layers reuse a learned local filter over spatial locations, making their parameter count independent of the number of positions at which it is applied.",
    "sections": [
      [
        "Local weighted sums",
        "PyTorch Conv2d implements cross-correlation: it slides a kernel without reversing its spatial coefficients. For one output channel at one location, multiply each covered input value by its corresponding kernel weight, sum across spatial positions and input channels, then add one output-channel bias. Multiple output channels use different filters. The same filter is reused across image positions.",
        "For input size n, padding p, dilation d, kernel width k and stride s, one output dimension is floor((n+2p-d(k-1)-1)/s+1). Dilation spaces kernel taps; its effective width is d(k-1)+1. Stride moves the sampling origin. The formula applies separately to height and width. Under ordinary groups=1, a biased layer has Cout*(Cin*kH*kW+1) parameters."
      ],
      [
        "Audit a small receptive field",
        "A receptive field is the part of the original image that can influence a given activation. Stacking local layers expands it, while pooling or strided layers also change the distance between neighboring output centers. Locality supplies a useful inductive bias; it does not ensure immunity to translations, backgrounds or dataset bias. Padding introduces boundary behavior that should be included in input tests.",
        "The fixture uses an explicitly assigned 2 by 2 kernel on a single 3 by 3 channel. For the first window, 1*1+2*0+4*0+5*(-1)=-4. Every translated window produces the same difference here. No training is implied: the point is to verify how a filter applies. In defect inspection, this makes it possible to distinguish a bad input layout from an incorrectly calculated filter response."
      ]
    ],
    "code": "import torch\nc=torch.nn.Conv2d(1,1,2,bias=False)\nwith torch.no_grad(): c.weight.copy_(torch.tensor([[[[1.,0.],[0.,-1.]]]]))\nx=torch.arange(1.,10.).reshape(1,1,3,3)\nprint(c(x).detach().flatten().tolist())\nprint(sum(p.numel() for p in c.parameters()))",
    "expect": "[-4.0, -4.0, -4.0, -4.0]\n4",
    "practice": [
      [
        "What does parameter sharing mean in a convolution?",
        "Reuse a filter spatially",
        "Give every pixel a new filter",
        "Tie every target class value",
        "Replace channels with labels",
        "One learned filter is applied repeatedly at multiple spatial locations."
      ],
      [
        "What does stride control in a spatial convolution?",
        "Window-origin spacing",
        "Class probability scale",
        "Training target dtype",
        "Number of optimizer moments",
        "Stride changes how far the filter origin moves between output positions."
      ],
      [
        "Which operation does ordinary Conv2d implement?",
        "Cross-correlation",
        "Spatial kernel reversal first",
        "Sorting pixels per channel",
        "Independent class sampling",
        "The documented operator applies its stored kernel without spatial reversal."
      ],
      [
        "A 5-wide input uses k=3,p=0,s=1,d=1. What output width follows?",
        "3",
        "5",
        "2",
        "1",
        "The valid kernel has three possible starting positions along that dimension."
      ],
      [
        "A defect model uses Cin=3,Cout=2,k=3 with bias. How many parameters?",
        "56",
        "54",
        "18",
        "20",
        "Each of two outputs owns 27 kernel weights and one bias."
      ],
      [
        "A filter expects three channels but receives NCHW with C=1. What must be fixed?",
        "Input channel contract",
        "Only label smoothing",
        "Only checkpoint filename",
        "Only class confidence",
        "Convolution channel dimensions must agree with the declared input representation."
      ]
    ],
    "formal": [
      [
        "What is one filter bias shared across in Conv2d?",
        "Spatial output locations",
        "Every output channel",
        "Every separate model file",
        "Every optimizer learning rate",
        "Each output channel has a bias reused across its spatial locations."
      ],
      [
        "What does dilation alter for a fixed kernel size?",
        "Kernel-tap spacing",
        "Class count",
        "File format",
        "Loss reduction",
        "Dilation spreads the sampled kernel positions without increasing tap count."
      ],
      [
        "Why can convolution use fewer weights than a dense image layer?",
        "Local shared filters",
        "Smaller inputs",
        "No biases",
        "Label compression",
        "Local connections and spatial reuse reduce the number of independently learned weights."
      ],
      [
        "A one-channel 2 by 2 patch is [[1,2],[3,4]], kernel [[1,0],[0,-1]], bias 2. What is its output?",
        "-1",
        "-3",
        "3",
        "5",
        "The weighted sum is 1-4=-3; adding bias two gives minus one."
      ],
      [
        "An input width 9 uses k=3,s=2,p=1,d=1. What width results?",
        "5",
        "4",
        "6",
        "9",
        "The output formula is floor((9+2-2-1)/2+1)=5."
      ],
      [
        "A layer changes from 32 by 32 input to 64 by 64 input while channels and kernel stay fixed. What happens to weight count?",
        "It stays unchanged",
        "It doubles",
        "It quadruples",
        "It scales with area",
        "Shared filter parameters depend on channels and kernel geometry rather than spatial input extent."
      ],
      [
        "A 3 by 3 dilated kernel uses dilation 2 and stride 1. What is its effective spatial width?",
        "5",
        "6",
        "3",
        "7",
        "Spacing three taps by two covers a five-position span: 2*(3-1)+1."
      ],
      [
        "A biased Conv2d maps 4 input channels to 8 outputs with 3 by 3 kernels, groups=1. What count should a reviewer expect?",
        "296",
        "288",
        "104",
        "72",
        "There are 8*(4*9+1)=296 trainable scalars including biases."
      ],
      [
        "A 10-wide input uses k=3,d=2,p=0,s=2. What output width follows the documented formula?",
        "3",
        "4",
        "5",
        "6",
        "The effective width is five, giving floor((10-5)/2+1)=3."
      ],
      [
        "A low-memory model needs shared local filters but its training images vary in size. Which property can be relied on?",
        "Fixed conv weight count",
        "Fixed flattened head width",
        "Perfect shift invariance",
        "Unchanged activation memory",
        "Convolution weights do not depend on input extent, although activation sizes and a flattened head can change."
      ]
    ],
    "steps": [
      "Assign exact filter weights without a fitting loop.",
      "Slide the kernel over four valid windows and calculate each sum.",
      "Check output values and the four shared parameters."
    ],
    "mistakes": [
      "Do not count one independent filter per image location.",
      "Do not omit dilation when calculating output shape."
    ],
    "takeaways": [
      "Track channel and spatial dimensions independently.",
      "Verify a small weighted window by hand before debugging a large CNN."
    ],
    "lang": "python-torch",
    "problem": "Trace convolution, shape and parameter sharing on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness.",
    "comps": [
      "m2.c1"
    ]
  },
  {
    "slug": "pooling-heads",
    "title": "Control pooling, receptive fields and CNN resource cost",
    "intro": "A mobile visual classifier must process larger photos without an enormous dense head. Pooling and adaptive aggregation reduce spatial representations, but they also discard location detail that a localization task may require.",
    "sections": [
      [
        "Downsampling trades detail for compactness",
        "Max pooling takes a local maximum; average pooling takes a local mean. A 2 by 2 stride-two pool halves even spatial dimensions without introducing trainable weights. It can suppress small structures or spatial precision. An adaptive average pool chooses output bins for a requested spatial size; mapping every channel to 1 by 1 creates one summary per channel before a linear classifier.",
        "A layer activation with B*C*H*W elements consumes that count times bytes per element, before considering gradients, optimizer state and temporary workspaces. Increasing both image dimensions by two roughly quadruples the same-width activation footprint. A smaller weight file does not guarantee a smaller peak working set. Evaluate target runtime and batch size rather than estimating memory from parameter count alone."
      ],
      [
        "Design for the output requirement",
        "For classification, global pooling can remove dependence of the linear head width on image dimensions. Detection and segmentation need spatially meaningful outputs; discarding all spatial coordinates before the prediction head is usually inappropriate. Skip connections combine representations and require compatible shapes or explicit projections. They improve optimization opportunities but do not prove a model is right for a product.",
        "The fixture contrasts maxima with averages over four nonoverlapping windows. The first window has values 1,2,5,6, so max is six and mean is 3.5. A global adaptive pool returns the overall 8.5 average. For a defect product, small scratches can disappear through repeated downsampling; inspect failures by object size before deciding that a faster network is acceptable."
      ]
    ],
    "code": "import torch\nimport torch.nn.functional as F\nx=torch.arange(1.,17.).reshape(1,1,4,4)\nprint(F.max_pool2d(x,2).flatten().tolist())\nprint(F.avg_pool2d(x,2).flatten().tolist())\nprint(F.adaptive_avg_pool2d(x,1).flatten().tolist())",
    "expect": "[6.0, 8.0, 14.0, 16.0]\n[3.5, 5.5, 11.5, 13.5]\n[8.5]",
    "practice": [
      [
        "Does ordinary max pooling learn kernel weights?",
        "No trainable weights",
        "One weight per output pixel",
        "One bias per input image",
        "A full dense weight matrix",
        "Pooling applies a fixed aggregation rule rather than learning convolution coefficients."
      ],
      [
        "What does global average pooling retain per channel?",
        "One mean activation",
        "Every original coordinate",
        "Every unpooled pixel value",
        "A ranked list of labels",
        "Global averaging produces a single spatial summary for each channel."
      ],
      [
        "What resource scales directly with B*C*H*W?",
        "Activation elements",
        "Output class dictionary",
        "Kernel parameter count",
        "Number of dataset groups",
        "The tensor element count follows the product of all four dimensions."
      ],
      [
        "A 4 by 4 feature map uses 2 by 2 stride-two pooling. What output shape follows?",
        "2 by 2",
        "4 by 4",
        "3 by 3",
        "1 by 4",
        "Nonoverlapping two-position windows fit twice along each dimension."
      ],
      [
        "A segmentation head receives only one global vector. What has been discarded?",
        "Spatial localization detail",
        "All learned parameters",
        "The existence of a batch",
        "The RGB label dictionary",
        "A global summary loses the dense spatial organization needed for per-pixel outputs."
      ],
      [
        "A team doubles height and width with fixed channels. How does one activation's element count change?",
        "Fourfold",
        "Twofold",
        "Unchanged",
        "Eightfold",
        "Both spatial axes double, so their product increases by four."
      ]
    ],
    "formal": [
      [
        "Which pooling operation returns a local largest activation?",
        "Max pooling",
        "Average pooling",
        "Channel permutation",
        "Softmax over classes",
        "Max pooling selects the largest value within each spatial window."
      ],
      [
        "What does adaptive average pooling specify directly?",
        "Output spatial dimensions",
        "Target class probabilities",
        "Optimizer parameter groups",
        "Training epoch schedule",
        "Adaptive pooling chooses bins to produce the requested spatial output size."
      ],
      [
        "What does a flattened dense head depend on?",
        "Input spatial extent",
        "Bias count",
        "Label names",
        "Resize mode",
        "Flattening channels and spatial positions changes linear input width when spatial extent changes."
      ],
      [
        "A pool window contains values [2,4,6,8]. Which max/average pair is correct?",
        "8 and 5",
        "8 and 4",
        "6 and 5",
        "20 and 8",
        "The maximum is eight and the arithmetic mean is twenty divided by four."
      ],
      [
        "A classifier outputs (8,64,7,7) before global pooling. What linear input width follows a 1 by 1 pool?",
        "64",
        "3136",
        "8",
        "49",
        "Each of the 64 channels contributes one spatially averaged feature."
      ],
      [
        "A CNN activation is (2,16,32,32) float32. What is its tensor storage alone?",
        "131072 bytes",
        "32768 bytes",
        "65536 bytes",
        "524288 bytes",
        "The tensor has 32768 elements at four bytes each; other runtime storage is excluded."
      ],
      [
        "A scratch occupies one pixel before three stride-two pools. Which risk should quality review prioritize?",
        "Small-defect information loss",
        "Increasing class-id precision",
        "Automatic label leakage",
        "More trainable pool weights",
        "Repeated downsampling can erase evidence for the smallest objects."
      ],
      [
        "Two stride-one 3 by 3 convolutions precede a 2 by 2 stride-two pool, with no dilation. What receptive-field width reaches each pooled output?",
        "6",
        "5",
        "7",
        "8",
        "Receptive width grows 1 to 3 to 5 and then to 6 at the pool."
      ],
      [
        "A 64-channel 8 by 8 map feeds ten classes. Compare biased dense flattening with global pooling then dense: parameter counts?",
        "40970 and 650",
        "40960 and 640",
        "40970 and 6410",
        "650 and 40970",
        "Flattening has 4096*10+10 weights; pooling first has 64*10+10."
      ],
      [
        "A product needs image-level defect labels and stable head dimensions across resolutions, while memory is limited. Which plan best fits?",
        "Global pool; measure peaks",
        "Flatten; assume fixed cost",
        "Upscale; ignore activations",
        "Dense pixels; count files",
        "Global pooling stabilizes head width, while peak activation measurement remains necessary for the resource constraint."
      ]
    ],
    "steps": [
      "Create a 4 by 4 feature map with known values.",
      "Calculate local maximum and average for its first window.",
      "Compare all pooled outputs and the global mean."
    ],
    "mistakes": [
      "Do not infer runtime memory from model file size.",
      "Do not discard all spatial information before a dense segmentation head."
    ],
    "takeaways": [
      "Choose aggregation according to required output granularity.",
      "Count activations as well as parameters."
    ],
    "lang": "python-torch",
    "problem": "Control pooling, receptive fields and CNN resource cost on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness.",
    "comps": [
      "m2.c1"
    ]
  },
  {
    "slug": "transfer-vision",
    "title": "Adapt a vision backbone while preserving its input and output contracts",
    "intro": "A retailer has a small labeled image collection and wants a reusable visual representation. Transfer learning reuses learned parameters from another task, then adapts a classifier or selected layers. The source distribution, preprocessing and output dictionary are as important as the tensor weights.",
    "sections": [
      [
        "Freeze parameters and control state separately",
        "A pretrained backbone may supply useful visual features, but its source task does not guarantee quality on a new camera or product category. Replace the source classification head with one matching the target class count. Keep the original resize and normalization assumptions unless deliberately retraining and validating a changed contract. Split target data before fitting the new head.",
        "Setting requires_grad=False excludes parameter gradients, while eval() changes training-mode behavior such as dropout and batch-normalization state updates. A frozen backbone used as a stable function needs a deliberate mode policy as well as gradient flags. Construct the optimizer from the trainable parameter set and inspect it; unfreezing a layer absent from the optimizer does not add it automatically."
      ],
      [
        "Validate adaptation before release",
        "Head-only fitting limits the adapted parameter count and can be a useful baseline on a small dataset. Selective unfreezing can improve adaptation but may overfit or disrupt transferable features. Compare independent validation by subgroup, capture condition and relevant class cost. Keep the final evaluation set out of model and learning-rate selection.",
        "The fixture deliberately creates a synthetic backbone rather than claiming downloaded pretrained quality. It freezes the backbone, fits one deterministic head step and confirms the backbone weights stay unchanged. A deployment artifact also needs class order, preprocessing, architecture and source lineage. The business decision is whether the adapted model passes the target conditions, not whether its architecture has a prestigious name."
      ]
    ],
    "code": "import torch\ntorch.set_num_threads(1)\nbackbone=torch.nn.Linear(2,2,bias=False)\nwith torch.no_grad(): backbone.weight.copy_(torch.eye(2))\nfor p in backbone.parameters(): p.requires_grad_(False)\nbackbone.eval()\nhead=torch.nn.Linear(2,1,bias=False)\nwith torch.no_grad(): head.weight.zero_()\nopt=torch.optim.SGD(head.parameters(),lr=.1)\nx=torch.tensor([[1.,2.]])\nloss=(head(backbone(x))-1).square().mean()\nloss.backward();opt.step()\nprint(backbone.weight.tolist())\nprint(head.weight.detach().tolist())",
    "expect": "[[1.0, 0.0], [0.0, 1.0]]\n[[0.20000000298023224, 0.4000000059604645]]",
    "practice": [
      [
        "What is replaced for a new image-classification label set?",
        "Source classification head",
        "Every input pixel coordinate",
        "All dataset split boundaries",
        "The tensor library runtime",
        "The target head must produce coordinates for the new task classes."
      ],
      [
        "What does requires_grad=False directly control?",
        "Parameter gradient tracking",
        "All module state updates",
        "Image-label validity",
        "Serving normalization scale",
        "Gradient tracking and training/evaluation mode are separate mechanisms."
      ],
      [
        "What does a frozen synthetic backbone prove about pretraining quality?",
        "No pretrained quality claim",
        "Universal visual usefulness",
        "Known source-domain accuracy",
        "Guaranteed transfer benefit",
        "A synthetic fixture can test mechanics without establishing learned representation quality."
      ],
      [
        "A frozen backbone has dropout still in training mode. Which issue remains?",
        "Stochastic feature function",
        "Weights must become labels",
        "Output rank always collapses",
        "Every gradient is retained",
        "Dropout can change output features even when parameter gradients are disabled."
      ],
      [
        "A target has four classes but the source head has 1000 outputs. What must change?",
        "Head and class mapping",
        "Only batch ordering",
        "Only image file format",
        "Only validation set title",
        "The output dimension and dictionary must match target supervision."
      ],
      [
        "A newly unfrozen block is absent from optimizer groups. What needs repair?",
        "Optimizer membership",
        "Only eval-mode flag",
        "Only RGB channel order",
        "Only source reference title",
        "The optimizer cannot update a parameter it does not own."
      ],
      [
        "A target label list is [metal,plastic] but serving reads [plastic,metal]. What artifact is wrong?",
        "Class dictionary",
        "Kernel stride",
        "Image batch size",
        "Dropout probability",
        "Target output coordinates must retain the fitted class dictionary."
      ],
      [
        "A target head improves only on its own fitting photos. Which evidence is still needed?",
        "Held-out target validation",
        "Source filename ordering",
        "An extra model nickname",
        "A larger checkpoint archive",
        "Transfer quality must be measured on independent target examples."
      ]
    ],
    "formal": [
      [
        "What transfers in ordinary pretrained-backbone adaptation?",
        "Learned feature parameters",
        "The target evaluation labels",
        "Guaranteed class semantics",
        "Every source training image",
        "Transfer reuses learned model parameters or representations, not target evaluation outcomes."
      ],
      [
        "What complements frozen weights for a stable dropout backbone?",
        "Evaluation mode",
        "Bigger batches",
        "BGR inputs",
        "Label smoothing",
        "Evaluation mode disables training-mode dropout behavior independently of gradient flags."
      ],
      [
        "Which artifact interprets classifier output positions?",
        "Target class dictionary",
        "Image compression metadata",
        "Optimizer step counter only",
        "Original source filename",
        "Output coordinates require the persisted target-label mapping."
      ],
      [
        "A target uses five mutually exclusive classes and 128 pooled features. How many biased head parameters are needed?",
        "645",
        "640",
        "133",
        "25600",
        "A 128-to-five affine head has 640 weights plus five biases."
      ],
      [
        "A head-only run improves validation while full unfreezing lowers only training loss. Which candidate has support from this evidence?",
        "Head-only candidate",
        "Fully unfrozen candidate",
        "Whichever file is larger",
        "Source head without changes",
        "The independent validation comparison supports the head-only candidate under the given result."
      ],
      [
        "A backbone expects standardized RGB but target training uses raw BGR. Which repair is most direct?",
        "Restore input contract",
        "Only increase head width",
        "Only freeze more weights",
        "Only rename target classes",
        "Feature meaning depends on the pretrained preprocessing assumptions."
      ],
      [
        "A frozen 20M-parameter backbone feeds a trainable 512-to-three biased head. How many scalars should the head optimizer own?",
        "1539",
        "20001539",
        "1536",
        "515",
        "The head has 512*3+3 trainable scalars; frozen backbone parameters need not be optimizer-owned."
      ],
      [
        "A source model has mutable batch-normalization buffers; weights are frozen but train mode remains. What can change after a batch?",
        "Running-statistic buffers",
        "The target label dictionary",
        "Every frozen weight value",
        "The source dataset checksum",
        "Training-mode batch normalization can update buffers despite frozen trainable parameters."
      ],
      [
        "A one-weight head starts at zero on feature x=2, target 1 and squared error. At learning rate .1, what is its next weight?",
        ".4",
        ".2",
        "-.4",
        ".1",
        "The derivative is 2*(0-1)*2=-4; subtracting .1 times that gradient yields .4."
      ],
      [
        "A small-data transfer release must preserve source features and reproduce target outputs. Which bundle fits?",
        "Frozen eval plus contracts",
        "Frozen train plus labels",
        "Head weights plus filenames",
        "Optimizer state plus charts",
        "Stable backbone mode and the persisted input/output contracts are required to reproduce the intended adapted function."
      ]
    ],
    "steps": [
      "Build an explicitly synthetic identity backbone.",
      "Freeze it, set evaluation mode and update only the zero-initialized head.",
      "Check unchanged backbone weights and the analytically expected head gradient step."
    ],
    "mistakes": [
      "Do not call random or synthetic weights pretrained.",
      "Do not treat freezing and eval mode as interchangeable."
    ],
    "takeaways": [
      "Adapt and validate the target output contract.",
      "Audit optimizer ownership when changing trainable layers."
    ],
    "lang": "python-torch",
    "problem": "Adapt a vision backbone while preserving its input and output contracts on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness.",
    "comps": [
      "m2.c2"
    ]
  },
  {
    "slug": "task-contracts",
    "title": "Choose classification, detection or segmentation from the business output",
    "intro": "A recycling operator asks where contamination occurs. The phrase recognize contamination leaves the output unspecified. A useful vision design begins with the decision unit, annotation granularity and error costs, then chooses a model family that can produce the required evidence.",
    "sections": [
      [
        "Output granularity defines supervision",
        "Classification assigns a label or label vector to an image; it does not inherently locate objects. Detection predicts object instances with boxes, classes and confidence scores. Semantic segmentation assigns class labels to pixels. Instance segmentation additionally distinguishes individual objects of the same class. These tasks require different annotations and cannot be substituted solely because one has a higher headline accuracy.",
        "A frame containing several defect types is multi-label at image level, whereas exactly one mutually exclusive category is multiclass. Independent sigmoid outputs can model nonexclusive labels; softmax imposes a probability distribution over mutually exclusive alternatives. For semantic segmentation with exclusive pixel classes, each pixel has its own class distribution. An object detector may also include a declared background or no-object mechanism."
      ],
      [
        "Connect outputs to action",
        "If a robot needs a grasp point around each item, image-level classification is insufficient. Boxes may be sufficient for counting separated packages; pixel masks are needed to measure defect surface area. Annotation costs, overlap, occlusion and minimum object size constrain the practical choice. Define an acceptable miss cost and an uncertainty path before promising automation.",
        "The fixture maps three synthetic probability vectors to either a single class or several labels above a threshold. It demonstrates exclusivity, not a trained vision model. A screening workflow can tolerate a human review queue but a sorting actuator needs localization and timing guarantees. Write the downstream output schema and units first so evaluation measures the thing the business will actually consume."
      ]
    ],
    "code": "import torch\ns=torch.tensor([[.7,.2,.1],[.2,.7,.6]])\nprint(s.argmax(1).tolist())\nprint((s>=.5).int().tolist())\nmask=torch.tensor([[0,1],[1,1]])\nprint(int((mask==1).sum()))",
    "expect": "[0, 1]\n[[1, 0, 0], [0, 1, 1]]\n3",
    "practice": [
      [
        "Which task produces an image-level category?",
        "Classification",
        "Bounding-box detection",
        "Semantic segmentation",
        "Instance-mask assignment",
        "Classification summarizes labels at image level without inherently locating objects."
      ],
      [
        "Which task needs a class label for each pixel?",
        "Semantic segmentation",
        "Image-only classification",
        "Image duplicate hashing",
        "Whole-frame ranking only",
        "Semantic segmentation supplies dense pixel-level categories."
      ],
      [
        "What distinguishes instance from semantic segmentation?",
        "Separate object identities",
        "Only higher input resolution",
        "Only different channel scale",
        "Only fewer class labels",
        "Instance segmentation separates individual objects even when they share a class."
      ],
      [
        "A robot must locate three cartons in one frame. Which output is minimally relevant?",
        "Three object boxes",
        "One carton image label",
        "One global average color",
        "One dataset split index",
        "Object localization is needed to act separately on the cartons."
      ],
      [
        "A photo may show rust and cracks simultaneously. Which label assumption applies?",
        "Nonexclusive labels",
        "Exactly one global class",
        "One mandatory box only",
        "Every pixel is background",
        "Multiple conditions can co-occur, so image-level labels need not be mutually exclusive."
      ],
      [
        "A business measures damaged surface percentage. Which target supports that directly?",
        "Pixel defect mask",
        "Image defect flag only",
        "Object confidence alone",
        "Camera serial number",
        "A mask supports counting damaged pixels relative to the relevant area."
      ],
      [
        "A monitoring UI needs a red overlay around contaminated pixels. Which output fits?",
        "A segmentation mask",
        "One frame-level class id",
        "A model checkpoint hash",
        "One image embedding only",
        "The requested overlay is spatial and requires pixel-level evidence."
      ],
      [
        "A counter needs individual products under partial overlap. Which supervision supports counting?",
        "Instance annotations",
        "One label per video",
        "One label per camera",
        "Unlabeled average colors",
        "Instance-level supervision distinguishes countable objects within a frame."
      ]
    ],
    "formal": [
      [
        "What does object detection add beyond image-level classification?",
        "Object localization",
        "Guaranteed physical scale",
        "Automatic image privacy",
        "Unique image file format",
        "Detection identifies spatial instances rather than only assigning a whole-image label."
      ],
      [
        "Which output naturally supports an image with several concurrent conditions?",
        "Multi-label vector",
        "One mutually exclusive id",
        "One scalar height value",
        "One image checksum string",
        "Independent label indicators allow multiple conditions to be present."
      ],
      [
        "What does a semantic mask encode at each pixel?",
        "A category identifier",
        "A model learning rate",
        "A whole-image filename",
        "A unique training epoch",
        "Semantic segmentation maps spatial pixels to their category ids."
      ],
      [
        "A warehouse needs counts of clearly separated crates and approximate locations. Which starting task matches?",
        "Box detection",
        "Classification",
        "Color regression",
        "Frame similarity",
        "Instances with boxes support both approximate positions and counts."
      ],
      [
        "A medical tool must outline a lesion boundary. Which output is directly useful?",
        "Lesion mask",
        "Positive flag",
        "One confidence",
        "Feature mean",
        "A mask provides the spatial boundary required by the stated task."
      ],
      [
        "A system uses softmax for labels that can co-occur. Which contract is inconsistent?",
        "Mutual exclusivity",
        "Fixed tensor dtype",
        "Known image dimensions",
        "Persisted class ordering",
        "Softmax treats alternatives as a normalized exclusive distribution, conflicting with nonexclusive conditions."
      ],
      [
        "A 100-pixel material region contains 23 defective pixels. What defect percentage follows the mask?",
        "23%",
        "77%",
        ".23%",
        "43.48%",
        "The damaged fraction is 23 divided by 100, or 23 percent."
      ],
      [
        "A frame has two overlapping people of the same class; analytics needs each person's silhouette. Which representation is required?",
        "Instance masks",
        "Semantic mask",
        "One image score",
        "One frame id",
        "A semantic mask merges class identity, while instance masks distinguish the two people."
      ],
      [
        "A binary classifier labels every positive frame correctly but cannot locate the hazardous object. Which downstream claim remains unsupported?",
        "Safe robotic interception",
        "Frame-level screening score",
        "Image-label accuracy value",
        "Positive-frame recall value",
        "A localization-dependent action cannot be established by whole-frame classification accuracy."
      ],
      [
        "A sorter needs each object's outline, class and separate identity under overlap. Which plan matches the complete output contract?",
        "Instance segmentation",
        "Image-level multilabel head",
        "Semantic class mask only",
        "Single bounding box per frame",
        "Instance segmentation provides per-object separation and masks alongside class information."
      ]
    ],
    "steps": [
      "Compare argmax with independent thresholding for declared label scores.",
      "Count defect-class pixels in a synthetic mask.",
      "Relate each output to the business decision it can support."
    ],
    "mistakes": [
      "Do not infer object locations from a whole-image accuracy score.",
      "Do not force co-occurring labels into an exclusive softmax contract."
    ],
    "takeaways": [
      "Specify output granularity before choosing a model.",
      "Match annotations and evaluation to the actual downstream decision."
    ],
    "lang": "python-torch",
    "problem": "Choose classification, detection or segmentation from the business output on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness.",
    "comps": [
      "m3.c1"
    ]
  },
  {
    "slug": "iou-matching",
    "title": "Evaluate overlap and match detections one to one",
    "intro": "A shelf detector emits multiple boxes around the same product. A high-overlap prediction is useful only under a declared coordinate convention and matching protocol. Counting every overlapping box as correct inflates performance and conceals duplicate detections.",
    "sections": [
      [
        "Compute intersection over union",
        "For axis-aligned half-open boxes, intersection width is max(0,min(x2a,x2b)-max(x1a,x1b)); height is analogous. Intersection area is width times height. Union is areaA+areaB-intersection, and IoU is intersection/union when the union is positive. Boxes that merely touch have zero intersection area. Reject or explicitly handle degenerate boxes instead of hiding divide-by-zero cases.",
        "A detection counts as a true positive only when its class is compatible and its IoU exceeds the declared threshold with an unmatched ground-truth instance. A common protocol processes predictions by descending confidence and allows one prediction per ground truth. Unmatched predictions, wrong-class boxes and duplicates count as false positives; unmatched ground truths count as false negatives. A localization threshold is distinct from a confidence cutoff."
      ],
      [
        "Audit errors at the right scale",
        "Precision is TP/(TP+FP); recall is TP/(TP+FN). Increasing an IoU threshold can convert a loosely localized true positive into a false positive and leave a false negative. A small coordinate error can affect tiny objects much more than large ones. Report relevant object-size and capture-condition segments with their sample counts.",
        "The worked boxes each have area four and intersection two, so union six yields IoU one third. A second local calculation shows that two predictions for one object yield only one true positive when both otherwise qualify. This synthetic matching arithmetic is not a full benchmark implementation; a published evaluator may specify tie rules, ignored regions and maximum detections that must be reproduced exactly."
      ]
    ],
    "code": "import torch\na=torch.tensor([0.,0.,2.,2.]);b=torch.tensor([1.,0.,3.,2.])\nwh=(torch.minimum(a[2:],b[2:])-torch.maximum(a[:2],b[:2])).clamp(min=0)\ninter=wh.prod();area=lambda z:(z[2:]-z[:2]).prod()\nprint(round(float(inter/(area(a)+area(b)-inter)),6))\ntp,fp,fn=1,1,0\nprint(tp/(tp+fp),tp/(tp+fn))",
    "expect": "0.333333\n0.5 1.0",
    "practice": [
      [
        "What is the denominator of IoU?",
        "Union area",
        "Intersection width only",
        "Sum of confidences",
        "Ground-truth class count",
        "IoU divides common spatial area by the area covered by either box."
      ],
      [
        "What is the intersection area for boxes that only touch?",
        "Zero",
        "One square unit always",
        "The smaller box area",
        "The larger box area",
        "Half-open boxes with no positive overlap have zero intersection area."
      ],
      [
        "What prevents duplicate boxes from inflating true positives?",
        "One-to-one matching",
        "Counting every overlap",
        "Ignoring confidence order",
        "Deleting every false negative",
        "Each ground-truth object can be claimed by only one qualifying prediction."
      ],
      [
        "Two identical predictions qualify for one labeled object. What counts follow?",
        "TP=1,FP=1",
        "TP=2,FP=0",
        "TP=0,FN=2",
        "TP=1,FN=1 only",
        "Only one prediction can match the object; the duplicate becomes a false positive."
      ],
      [
        "A perfectly aligned box predicts the wrong class. Is it a correct class-aware detection?",
        "No, class mismatch",
        "Yes, geometry is enough",
        "Yes, if its area is large",
        "Yes, if score exceeds .9",
        "Class-aware matching requires the predicted and annotated classes to agree."
      ],
      [
        "An IoU threshold rises from .5 to .75 for a box with .6 IoU. What happens to its match?",
        "It stops qualifying",
        "It becomes more correct",
        "Its geometric area doubles",
        "Its confidence becomes .75",
        "The same localization no longer meets the stricter matching threshold."
      ]
    ],
    "formal": [
      [
        "What does IoU measure for two valid boxes?",
        "Relative spatial overlap",
        "Probability calibration",
        "Color-channel agreement",
        "Parameter-count similarity",
        "IoU compares their intersection area with their union area."
      ],
      [
        "Which error is an unmatched prediction under detection evaluation?",
        "False positive",
        "True negative",
        "False negative",
        "True positive",
        "A prediction without a qualifying ground-truth match is counted as a false positive."
      ],
      [
        "Why must the coordinate convention be recorded?",
        "Area arithmetic depends on it",
        "It determines model optimizer",
        "It fixes class prevalence",
        "It replaces label quality",
        "Inclusive and half-open endpoints differ in area rules, especially for small boxes."
      ],
      [
        "Box A has area 20, B area 15 and intersection 10. What IoU follows?",
        ".4",
        ".5",
        ".667",
        ".286",
        "The union is 20+15-10=25, and 10/25=.4."
      ],
      [
        "A ground truth has two correct-class predictions scored .9 and .8, both above the IoU gate. What is the usual greedy result?",
        "Higher score TP; other FP",
        "Each prediction is TP",
        "Lower score TP; other ignored",
        "Each prediction is FN",
        "Descending confidence matching gives the first qualifying prediction the single available match."
      ],
      [
        "A detector returns 8 matched boxes and 2 unmatched boxes while 4 objects are missed. Which precision/recall pair follows?",
        ".8 and .667",
        ".667 and .8",
        ".8 and .6",
        ".4 and .8",
        "Precision is 8/10; recall is 8/(8+4), approximately two thirds."
      ],
      [
        "Two 4 by 4 boxes are horizontally offset by 2 and aligned vertically. What IoU results?",
        "1/3",
        "1/2",
        "2/3",
        "1/4",
        "Intersection is 2*4=8 and union is 16+16-8=24."
      ],
      [
        "A predicted area-9 box is entirely inside an area-36 truth box. Which IoU follows?",
        ".25",
        ".75",
        "1",
        "4",
        "Intersection is nine, union is 36, giving one quarter."
      ],
      [
        "There are three truths; four predictions yield two unique correct matches and two duplicates. Which (TP,FP,FN) counts apply?",
        "(2,2,1)",
        "(4,0,1)",
        "(2,1,2)",
        "(3,1,0)",
        "Two unique truths are matched, both duplicates are false positives, and one truth is missed."
      ],
      [
        "A stricter box benchmark needs stable comparison across model versions. Which evaluation plan preserves comparability?",
        "Fix geometry and matching",
        "Tune IoU per candidate",
        "Count each overlap as TP",
        "Drop small objects silently",
        "A fixed coordinate and matching policy is necessary for meaningful version-to-version comparison."
      ]
    ],
    "steps": [
      "Calculate clamped overlap widths and intersection area.",
      "Compute union and divide to obtain one-third IoU.",
      "Apply one-to-one matching to a duplicate-prediction precision/recall case."
    ],
    "mistakes": [
      "Do not count several boxes as separate successes for one object.",
      "Do not confuse a confidence threshold with an IoU threshold."
    ],
    "takeaways": [
      "Record coordinate and matching protocols.",
      "Inspect localization errors by object size."
    ],
    "lang": "python-torch",
    "problem": "Evaluate overlap and match detections one to one on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness.",
    "comps": [
      "m3.c2"
    ]
  },
  {
    "slug": "ap-protocol",
    "title": "Interpret precision-recall ranking, AP and segmented vision evaluation",
    "intro": "A store detector looks accurate at one confidence cutoff yet creates too many review tickets during busy hours. Average precision summarizes ranked detections across recall, but it depends on annotation, matching and interpolation rules. A release needs a reproducible metric protocol plus operating-point evidence.",
    "sections": [
      [
        "Ranking before a single cutoff",
        "Sort detections by descending confidence, then calculate cumulative true and false positives under fixed matching rules. At each rank, precision is cumulative TP divided by predictions seen; recall is cumulative TP divided by total ground truths. Average precision integrates a precision-recall summary according to a specified convention. A simple noninterpolated AP sums precision at true-positive ranks divided by the number of ground truths.",
        "The worked fixture uses that explicitly named noninterpolated convention: for TP,FP,TP with two truths, precision at the true-positive ranks is 1 and 2/3, giving AP=5/6. Benchmark AP may instead use interpolated precision at a recall grid. Do not compare numbers from different conventions as if they were the same metric. Mean AP averages the declared AP values over classes and possibly IoU thresholds."
      ],
      [
        "Operational release evidence",
        "An AP increase does not guarantee better recall at the business confidence cutoff. Choose a threshold with development data using review capacity or miss cost, then evaluate the locked operating point independently. For segmentation, report per-class IoU with a declared treatment of absent classes; global pixel accuracy can hide failure on a small defect class.",
        "Label delay, sparse classes, domain shift and camera changes can all undermine a headline aggregate. Report sample counts and uncertainty where feasible, especially for rare critical defects. The fixture also computes a two-class mAP from declared AP values, without claiming a full benchmark implementation. A release checklist should pin dataset groups, annotation policy, class dictionary, IoU gates, AP convention and postprocessing so another engineer can reproduce the comparison."
      ]
    ],
    "code": "import torch\nt=torch.tensor([1.,0.,1.])\np=t.cumsum(0)/torch.arange(1,4)\nap=(p*t).sum()/2\nprint(round(float(ap),6))\nprint(round((.8+.6)/2,6))",
    "expect": "0.833333\n0.7",
    "practice": [
      [
        "What does precision-recall ranking order detections by?",
        "Confidence score",
        "Image filename length",
        "Ground-truth box area only",
        "Output tensor byte offset",
        "The ranked curve is formed by accepting predictions in score order."
      ],
      [
        "What must accompany an AP value for reproducibility?",
        "Evaluation convention",
        "Only a model nickname",
        "Only a weight file size",
        "Only a training duration",
        "Matching, recall interpolation and averaging rules affect the reported AP."
      ],
      [
        "What does class mAP average under a declared class-only protocol?",
        "Per-class AP values",
        "Per-image file sizes",
        "Per-pixel RGB means",
        "Per-layer gradient norms",
        "Class mAP is the mean of class-specific AP values under the same protocol."
      ],
      [
        "A model has AP .8 for class A and .4 for B. What is their unweighted mAP?",
        ".6",
        ".8",
        ".4",
        "1.2",
        "An unweighted two-class mean is (.8+.4)/2=.6."
      ],
      [
        "A defect occupies 1% of pixels and is always missed. Which metric can still look high?",
        "Global pixel accuracy",
        "Defect recall of one",
        "Defect IoU of one",
        "Perfect classwise mAP",
        "Predicting background everywhere can achieve 99% pixel accuracy while missing every defect."
      ],
      [
        "A team tunes score thresholds on its final benchmark labels. Which boundary is lost?",
        "Independent final evaluation",
        "Tensor channel compatibility",
        "Box coordinate convention",
        "Native runtime capability",
        "Threshold selection consumes the labels as development evidence."
      ]
    ],
    "formal": [
      [
        "What does increasing a score threshold ordinarily trade off?",
        "Precision and recall",
        "Image width and height",
        "Parameter count and bias",
        "RGB and grayscale channels",
        "Accepting fewer detections typically changes the false-positive and miss balance."
      ],
      [
        "What is required to compare two AP results fairly?",
        "Same evaluation protocol",
        "Same training chart color",
        "Same model filename length",
        "Same optimizer type only",
        "Dataset and scoring rules must agree for the comparison to have the intended meaning."
      ],
      [
        "What is noninterpolated AP in the stated lesson convention?",
        "Mean precision at TP ranks",
        "Maximum confidence score",
        "Accuracy over background pixels",
        "Mean of all box areas",
        "Sum precision at true-positive ranks and divide by the total ground-truth count."
      ],
      [
        "With two truths, ranked outcomes TP,FP,TP give what noninterpolated AP?",
        "5/6",
        "2/3",
        "1/2",
        "1",
        "True positives occur at precision 1 and 2/3, and their sum is divided by two."
      ],
      [
        "A detector has outcomes FP,TP,TP with two truths. Which noninterpolated AP is correct?",
        "7/12",
        "5/6",
        "1/3",
        "1",
        "Precision at true-positive ranks is 1/2 and 2/3, so their average is 7/12."
      ],
      [
        "A class has segmentation TP=30,FP=10,FN=20. What class IoU follows?",
        ".5",
        ".6",
        ".75",
        ".667",
        "Class IoU is TP/(TP+FP+FN)=30/60=.5."
      ],
      [
        "A release has AP .9 but recall .4 at the deployed cutoff; the required recall is .8. Which criterion is unmet?",
        "Operating-point recall",
        "Ranked AP below .5",
        "Input channel dimension",
        "Number of model outputs",
        "A high ranked summary cannot override the explicit recall requirement at the actual decision threshold."
      ],
      [
        "Class AP values are .9,.6,.3 and no class weighting is specified. Which macro mAP applies?",
        ".6",
        ".9",
        ".45",
        "1.8",
        "The unweighted mean is 1.8 divided by three, or .6."
      ],
      [
        "At threshold .4, a model creates 120 reviews/day with recall .92; at .7 it creates 50 with recall .78. Capacity is 60 and recall gate .85. Which release choice follows both gates?",
        "Neither qualifies",
        "Choose .4",
        "Choose .7",
        "Average thresholds",
        "The low threshold violates capacity and the high threshold violates recall; another validated plan is needed."
      ],
      [
        "A candidate improves frequent-class AP but loses rare-defect recall under a safety gate. Which comparison is decision-relevant?",
        "Per-class gated evaluation",
        "Only the overall AP mean",
        "Only training loss reduction",
        "Only total prediction count",
        "Segmented performance and the explicit rare-defect constraint determine whether the aggregate gain is acceptable."
      ]
    ],
    "steps": [
      "Form cumulative precision for the ranked synthetic match sequence.",
      "Sum precision only at true-positive ranks and divide by two truths.",
      "Compare this named AP convention with a simple class-only mean."
    ],
    "mistakes": [
      "Do not compare AP implementations with different interpolation rules silently.",
      "Do not use background-dominated pixel accuracy as evidence of defect recall."
    ],
    "takeaways": [
      "Pin the scoring protocol and operating point.",
      "Inspect per-class failures alongside aggregate mAP."
    ],
    "lang": "python-torch",
    "problem": "Interpret precision-recall ranking, AP and segmented vision evaluation on a synthetic local fixture.",
    "limit": "The printed result verifies only the declared synthetic in-memory computation. Native CPU execution uses the selected runtime; it does not establish image-dataset quality, production accuracy, device behavior or deployment readiness.",
    "comps": [
      "m3.c2"
    ]
  }
],[
  {
    "id": "cv-conv",
    "title": "PyTorch Conv2d cross-correlation, shape and parameter API",
    "url": "https://github.com/pytorch/pytorch/blob/31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457/torch/nn/modules/conv.py",
    "source": {
      "repo": "pytorch/pytorch",
      "commit": "31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457",
      "path": "torch/nn/modules/conv.py",
      "verification": "Pinned official source bytes read. Local synthetic CPU fixtures verify arithmetic only; benchmark AP is explicitly a lesson-defined convention. Human educational review pending."
    }
  },
  {
    "id": "cv-pool",
    "title": "PyTorch pooling operators and output dimensions",
    "url": "https://github.com/pytorch/pytorch/blob/31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457/torch/nn/modules/pooling.py",
    "source": {
      "repo": "pytorch/pytorch",
      "commit": "31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457",
      "path": "torch/nn/modules/pooling.py",
      "verification": "Pinned official source bytes read. Local synthetic CPU fixtures verify arithmetic only; benchmark AP is explicitly a lesson-defined convention. Human educational review pending."
    }
  },
  {
    "id": "cv-resize",
    "title": "PyTorch interpolation and functional tensor operations",
    "url": "https://github.com/pytorch/pytorch/blob/31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457/torch/nn/functional.py",
    "source": {
      "repo": "pytorch/pytorch",
      "commit": "31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457",
      "path": "torch/nn/functional.py",
      "verification": "Pinned official source bytes read. Local synthetic CPU fixtures verify arithmetic only; benchmark AP is explicitly a lesson-defined convention. Human educational review pending."
    }
  },
  {
    "id": "cv-state",
    "title": "PyTorch module modes, gradients and state",
    "url": "https://github.com/pytorch/pytorch/blob/31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457/torch/nn/modules/module.py",
    "source": {
      "repo": "pytorch/pytorch",
      "commit": "31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457",
      "path": "torch/nn/modules/module.py",
      "verification": "Pinned official source bytes read. Local synthetic CPU fixtures verify arithmetic only; benchmark AP is explicitly a lesson-defined convention. Human educational review pending."
    }
  }
]);
