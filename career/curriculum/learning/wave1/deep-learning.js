'use strict';
const {course}=require('./wave4-ai-next-helper');
module.exports=course("deep-learning",[
  {
    "slug": "affine-activations",
    "title": "Trace layers, shapes and nonlinear activations",
    "intro": "A support classifier receives two numerical features per ticket. A dense layer forms affine scores; an activation changes what combinations of layers can express. Reading shapes before training prevents a silent confusion between a batch of examples and the features of one example.",
    "sections": [
      [
        "From a record to hidden units",
        "For a batch X of shape B by d, a dense layer with h outputs computes XWᵀ+b, where W has shape h by d and b has h entries. There are dh+h trainable scalars. Each row is an example; sharing W across rows does not couple their labels. A linear layer in PyTorch is affine when bias is enabled.",
        "A stack of affine maps without intervening nonlinearities collapses to one affine map. Adding layers alone therefore does not create nonlinear decision boundaries. ReLU computes max(0,z) elementwise: negative preactivations are zero and positive values pass through. Its derivative is zero on negative inputs and one on positive inputs; the kink needs an implementation convention."
      ],
      [
        "Choose capacity deliberately",
        "Hidden width controls a family of functions, not an assurance of useful accuracy. Saturating activations can attenuate gradients; ReLU can leave units inactive on an entire observed region. Inspect activation statistics and gradients rather than naming an activation as a universal cure. Preserve batch dimensions when B equals one so a valid arithmetic result does not hide a serving shape error.",
        "The fixture sets exact weights and a bias before evaluating two rows. This is a forward-pass trace rather than a fitted model. Reading a tensor shape and matching a manually calculated row are complementary checks: either can be correct while feature ordering remains wrong."
      ]
    ],
    "code": "import torch\ntorch.set_num_threads(1)\ntorch.manual_seed(7)\nlayer=torch.nn.Linear(2,2)\nwith torch.no_grad():\n layer.weight.copy_(torch.tensor([[1.,-1.],[2.,0.]]))\n layer.bias.copy_(torch.tensor([0.,1.]))\nx=torch.tensor([[3.,1.],[-1.,2.]])\nprint(torch.relu(layer(x)).tolist())\nprint(sum(p.numel() for p in layer.parameters()))",
    "expect": "[[2.0, 7.0], [0.0, 0.0]]\n6",
    "lang": "python-torch",
    "problem": "Trace layers, shapes and nonlinear activations using the declared synthetic fixture.",
    "steps": [
      "Set the two declared affine rows and biases.",
      "Multiply each input row by the weight transpose and add bias.",
      "Clip each negative preactivation to zero and count six trainable scalars."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual CPU PyTorch 2.15.0+cpu. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "A stack of affine maps without intervening nonlinearities collapses to one affine map.",
      "The fixture sets exact weights and a bias before evaluating two rows."
    ],
    "takeaways": [
      "For a batch X of shape B by d, a dense layer with h outputs computes XWᵀ+b, where W has shape h by d and b has h entries.",
      "Hidden width controls a family of functions, not an assurance of useful accuracy."
    ],
    "practice": [
      [
        "What does a dense layer share across batch rows?",
        "The learned weight matrix",
        "Each row's target value",
        "Every row's feature values",
        "A unique matrix per row",
        "One parameter set transforms each input example."
      ],
      [
        "Which expression defines ReLU on a scalar z?",
        "max(0,z)",
        "min(0,z)",
        "1/(1+z)",
        "z squared",
        "ReLU suppresses negative preactivations and preserves positive ones."
      ],
      [
        "What shape does Linear(4,3) produce for a 5 by 4 input?",
        "5 by 3",
        "3 by 5",
        "4 by 3",
        "5 by 4",
        "The batch dimension stays five while the output width becomes three."
      ],
      [
        "A ticket pipeline swaps two input features but keeps weights. Which check targets this defect?",
        "Named feature order",
        "Increase hidden width by one",
        "Print only the batch count",
        "Change all biases to zero",
        "Shape compatibility cannot validate feature semantics."
      ],
      [
        "A team stacks affine layers with no activation. What function family remains?",
        "Affine transformations",
        "Arbitrary nonlinear boundaries",
        "Only constant functions",
        "Only orthogonal rotations",
        "Composing affine maps yields another affine map."
      ],
      [
        "A serving test flattens a batch of one. What contract needs checking?",
        "Explicit batch and feature axes",
        "Whether every weight is positive",
        "Whether the label is text",
        "Only the optimizer name",
        "Flattening can erase an axis expected by downstream operations."
      ]
    ],
    "formal": [
      [
        "What does the bias add to a dense layer?",
        "One offset per output unit",
        "One target per input row",
        "An independent input dataset",
        "A probability normalization",
        "Bias shifts each output coordinate and is shared across batch rows."
      ],
      [
        "Which activation clips negative preactivations to zero?",
        "Rectified linear unit",
        "Identity map",
        "Matrix transpose",
        "Softmax over the batch",
        "ReLU is the elementwise positive part."
      ],
      [
        "How many parameters are in a biased dense layer from 3 to 2 units?",
        "8",
        "6",
        "5",
        "12",
        "There are six weights and two output biases."
      ],
      [
        "A product model uses shape (8,5) inputs and weight (4,5). Which affine output shape is valid?",
        "8 by 4",
        "4 by 8",
        "5 by 4",
        "8 by 5",
        "X multiplies the transpose of W, preserving eight rows and yielding four outputs."
      ],
      [
        "A classifier doubles width but keeps affine-only layers. Which claim follows?",
        "It still represents an affine map",
        "It now represents every Boolean rule",
        "Its loss is guaranteed to halve",
        "Its gradients become probabilities",
        "Width does not supply the missing nonlinear operation."
      ],
      [
        "A support row is x=(2,-1), w=(3,2), b=-5. What does ReLU return?",
        "0",
        "-1",
        "1",
        "5",
        "The affine score is 6-2-5=-1 and ReLU clips it to zero."
      ],
      [
        "A batch has 32 rows and 10 features; Linear(10,6) includes bias. Which pair is correct?",
        "Output (32,6), 66 parameters",
        "Output (6,32), 66 parameters",
        "Output (32,6), 60 parameters",
        "Output (32,10), 192 parameters",
        "The batch axis is preserved; 10×6 weights plus six biases give 66 parameters."
      ],
      [
        "A two-layer scalar network has h=2x+1 and y=3h-4 without activation. Which equivalent rule serves the same scores?",
        "y=6x-1",
        "y=6x+1",
        "y=5x-3",
        "y=6x-4",
        "Substitution gives 3(2x+1)-4=6x-1."
      ],
      [
        "For x=(-2,3), one hidden preactivation is z=x1-x2+1. With ReLU and upstream derivative 4, what reaches x1 away from the kink?",
        "0",
        "4",
        "-4",
        "16",
        "The preactivation is -4, so the local ReLU derivative blocks the upstream gradient."
      ],
      [
        "A service must preserve nonlinear scoring and batch independence. Which change preserves both when exporting two dense layers?",
        "Keep ReLU; preserve batch rows",
        "Compose weights; preserve batch rows",
        "Keep ReLU; normalize across batch",
        "Keep ReLU; flatten batch rows",
        "The activation is needed for nonlinear behavior, and row-wise shape preserves independent requests."
      ]
    ]
  },
  {
    "slug": "loss-contracts",
    "title": "Match logits, targets and losses",
    "intro": "A triage model must assign one of three mutually exclusive labels. Training consumes logits and integer labels, while the application displays probabilities. Confusing these representations can produce a runnable loop whose gradients optimize the wrong quantity.",
    "sections": [
      [
        "Scores and likelihood",
        "For logits z, softmax gives p_k=exp(z_k)/Σ_j exp(z_j). Cross-entropy for class y is -log p_y; averaging across rows defines a mean batch loss. PyTorch CrossEntropyLoss accepts unnormalized logits for the ordinary integer-class case. It performs the needed log-softmax operation internally, so applying softmax first changes the training calculation.",
        "Use integer class indices with the declared class order and a compatible long target tensor for this case. Binary independent labels instead require an appropriate binary loss and target shape; a multi-label problem is not a single mutually exclusive class index. Probabilities close to zero for a true class imply large negative log-likelihood."
      ],
      [
        "Reduction and numerical stability",
        "Subtracting a common constant from logits leaves softmax unchanged. Stable log-sum-exp uses this invariance to avoid unnecessary overflow. The loss reduction changes gradient scale: summing per-example losses and averaging them differ by batch size when all else is equal. Report reduction and weighting when comparing learning rates or training curves.",
        "A low training loss alone cannot establish calibration or useful decisions. The fixture uses equal logits so probabilities and loss can be checked analytically. Production labels may be noisy or imbalanced; validation must use independent data and the relevant class costs."
      ]
    ],
    "code": "import torch\ntorch.set_num_threads(1)\ntorch.manual_seed(7)\nz=torch.zeros((2,3),requires_grad=True)\ny=torch.tensor([0,2],dtype=torch.long)\nloss=torch.nn.CrossEntropyLoss()(z,y)\nprint(round(float(loss.detach()),6))\nprint(torch.softmax(z,dim=1).detach().sum(1).tolist())",
    "expect": "1.098612\n[1.0, 1.0]",
    "lang": "python-torch",
    "problem": "Match logits, targets and losses using the declared synthetic fixture.",
    "steps": [
      "Create two rows of three zero logits and integer class targets.",
      "Evaluate mean cross-entropy without pre-applying softmax.",
      "Compare ln(3) with the printed loss and check each probability-row sum."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual CPU PyTorch 2.15.0+cpu. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Use integer class indices with the declared class order and a compatible long target tensor for this case.",
      "A low training loss alone cannot establish calibration or useful decisions."
    ],
    "takeaways": [
      "For logits z, softmax gives p_k=exp(z_k)/Σ_j exp(z_j).",
      "Subtracting a common constant from logits leaves softmax unchanged."
    ],
    "practice": [
      [
        "What does ordinary integer-target CrossEntropyLoss expect as model input?",
        "Unnormalized class logits",
        "Already rounded class ids",
        "A list of class names",
        "Only the largest probability",
        "The operation includes log-softmax in the loss calculation."
      ],
      [
        "What is the class-index target dtype in the shown example?",
        "torch.long",
        "torch.bool only",
        "torch.float16 only",
        "A Python string tensor",
        "Integer class indices use the long dtype in this standard loss contract."
      ],
      [
        "What does softmax normalize over for independent three-class rows?",
        "The class axis per row",
        "The batch axis per class",
        "Every model parameter",
        "Only the target index",
        "Each row represents its own mutually exclusive class distribution."
      ],
      [
        "A team applies softmax before CrossEntropyLoss. What should change?",
        "Pass logits to the loss",
        "Apply a second softmax",
        "Round probabilities before loss",
        "Replace labels with row ids",
        "The loss already performs the required normalization in log space."
      ],
      [
        "A clinic predicts three independent conditions. Which distinction matters?",
        "Label exclusivity",
        "Only the class name length",
        "Only the batch filename",
        "Whether labels are alphabetic",
        "Independent labels require their own binary-style target/loss contract."
      ],
      [
        "A developer compares sum loss with mean loss across batch sizes. What is missing?",
        "Reduction-aware scaling",
        "Only a new plotting color",
        "Only more hidden units",
        "Only sorted class names",
        "Sum and mean scale gradients and reported values differently."
      ]
    ],
    "formal": [
      [
        "Which quantity is negative log-likelihood for the true class?",
        "Minus log of its probability",
        "The largest raw logit",
        "The predicted class index",
        "The sum of target indices",
        "Cross-entropy penalizes low assigned true-class probability."
      ],
      [
        "Which softmax property follows from adding the same scalar to all logits?",
        "Probabilities stay unchanged",
        "Every probability doubles",
        "The winner becomes uniform",
        "The batch dimension disappears",
        "The common exponential factor cancels in numerator and denominator."
      ],
      [
        "Three equal logits produce which true-class loss?",
        "ln(3)",
        "0",
        "3",
        "1/3",
        "Uniform class probability is one third and negative log is ln(3)."
      ],
      [
        "A product classifier returns shape (6,4) logits. Six class indices are supplied. Which target shape fits the ordinary case?",
        "(6,)",
        "(4,)",
        "(6,4,1)",
        "(1,4)",
        "One integer class index is supplied for each batch row."
      ],
      [
        "A model assigns probability 0.25 to the correct class. What is its loss to three decimals?",
        "1.386",
        "0.250",
        "0.750",
        "4.000",
        "Negative natural log of 0.25 is about 1.386."
      ],
      [
        "A training job uses batch 20 with sum loss. Converting to mean with identical data does what to its gradient?",
        "Divides it by 20",
        "Multiplies it by 20",
        "Makes it identically zero",
        "Changes only the printed loss",
        "Averaging scales both scalar loss and its derivatives by the reciprocal batch size."
      ],
      [
        "A row has logits (1001,1000). Which probability for class zero is stable and correct?",
        "About 0.731",
        "About 0.500",
        "About 0.269",
        "Exactly 1.000",
        "Subtract 1000 to obtain equivalent logits (1,0), whose first softmax probability is about .731."
      ],
      [
        "Two rows have true-class probabilities .5 and .25. What is mean cross-entropy to three decimals?",
        "1.040",
        "0.375",
        "2.079",
        "0.693",
        "The mean is (-ln .5-ln .25)/2, about 1.040."
      ],
      [
        "An exclusive classifier uses logits (2,2,2) with target 1. What gradient is produced for that target logit under one-row cross-entropy?",
        "-2/3",
        "1/3",
        "2/3",
        "-1/3",
        "Softmax minus one-hot gives 1/3-1=-2/3 for the target coordinate."
      ],
      [
        "A service needs exclusive probabilities, stable training and a fixed class dictionary. Which design meets all constraints?",
        "Train logits; persist labels; softmax rows",
        "Train probabilities; persist labels; softmax rows",
        "Train logits; infer labels per request; softmax rows",
        "Train logits; persist labels; softmax batch",
        "The training contract, class semantics and independent serving normalization must all be preserved."
      ]
    ]
  },
  {
    "slug": "autograd-chain",
    "title": "Trace automatic differentiation and gradient accumulation",
    "intro": "A tiny neural scorer learns one coefficient. Automatic differentiation records tensor operations to calculate derivatives of a scalar loss. It saves manual bookkeeping, but the engineer still owns graph boundaries, gradient clearing and parameter updates.",
    "sections": [
      [
        "The chain rule is the mechanism",
        "For prediction a=wx and squared error L=(a-y)^2, dL/dw=2(a-y)x. Automatic differentiation applies local derivatives backward through the recorded graph. A leaf tensor with requires_grad=True accumulates derivatives in its .grad field after backward. Gradients describe local sensitivity at current values; they are not the parameter values themselves.",
        "Calling backward again on a newly built loss adds to existing gradients unless they are cleared. This accumulation can intentionally implement larger effective batches, but accidental accumulation changes the update. A graph is normally released after backward; recompute the forward pass rather than retaining every training graph unnecessarily."
      ],
      [
        "Detach only at explicit boundaries",
        "Converting a tensor to a Python number for logging or detaching it removes that value from subsequent derivative tracking. Use detachment for reporting or target construction only when that boundary is intended. Wrapping the forward pass used for training in no_grad prevents the graph required by backward. An optimizer cannot restore a graph that was never built.",
        "The fixture computes a derivative, reconstructs the same expression and accumulates it, then clears the stored gradient. It isolates one scalar chain-rule calculation. More complicated models need gradient and loss diagnostics; finite values do not prove the features or target are correct."
      ]
    ],
    "code": "import torch\ntorch.set_num_threads(1)\ntorch.manual_seed(7)\nw=torch.tensor(2.,requires_grad=True)\nx=torch.tensor(3.)\ny=torch.tensor(1.)\n((w*x-y)**2).backward()\nprint(float(w.grad))\n((w*x-y)**2).backward()\nprint(float(w.grad))\nw.grad=None\nprint(w.grad is None)",
    "expect": "30.0\n60.0\nTrue",
    "lang": "python-torch",
    "problem": "Trace automatic differentiation and gradient accumulation using the declared synthetic fixture.",
    "steps": [
      "Differentiate the squared residual at w=2,x=3,y=1.",
      "Build the same forward expression again and observe accumulated gradients.",
      "Clear the stored derivative and distinguish it from changing the parameter."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual CPU PyTorch 2.15.0+cpu. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Calling backward again on a newly built loss adds to existing gradients unless they are cleared.",
      "The fixture computes a derivative, reconstructs the same expression and accumulates it, then clears the stored gradient."
    ],
    "takeaways": [
      "For prediction a=wx and squared error L=(a-y)^2, dL/dw=2(a-y)x.",
      "Converting a tensor to a Python number for logging or detaching it removes that value from subsequent derivative tracking."
    ],
    "practice": [
      [
        "What does backward compute for a scalar differentiable loss?",
        "Recorded derivatives",
        "New class labels",
        "A guaranteed global optimum",
        "A serialized model artifact",
        "Autograd propagates derivatives by the chain rule."
      ],
      [
        "Where are leaf parameter gradients ordinarily accumulated?",
        "The .grad field",
        "The label vocabulary",
        "The module's name string",
        "The batch row counter",
        "Backward accumulates derivatives on gradient-tracking leaf parameters."
      ],
      [
        "For L=(wx-y)^2, which derivative is dL/dw?",
        "2(wx-y)x",
        "2(wx-y) alone",
        "w squared",
        "x+y",
        "The outer squared-error derivative multiplies the inner derivative x."
      ],
      [
        "A training loss is converted with item() before a new tensor is built. What boundary was introduced?",
        "Severed autograd path",
        "All parameters were normalized",
        "The target became a probability",
        "The optimizer doubled its rate",
        "A Python scalar reconstructed as a tensor does not retain the original graph."
      ],
      [
        "A team wants intentional microbatch accumulation. What should be explicit?",
        "Reset/scale policy",
        "Only progress-bar frequency",
        "A new model class per microbatch",
        "A random target per backward",
        "Accumulation changes effective scaling unless reduction and update boundaries are deliberate."
      ],
      [
        "A developer wraps training inference in no_grad. What fails?",
        "Training graph creation",
        "Printing tensor values",
        "Counting class names",
        "Allocating input arrays",
        "no_grad disables tracking for the enclosed forward operations."
      ]
    ],
    "formal": [
      [
        "Which mathematical rule links derivatives through a composition?",
        "Chain rule",
        "Majority voting",
        "Label smoothing",
        "Feature hashing",
        "The chain rule multiplies and sums local sensitivities through the graph."
      ],
      [
        "What does detach remove from a tensor result?",
        "Its autograd connection",
        "Its numerical value always",
        "Every tensor dimension",
        "The model's class names",
        "Detach shares a value boundary without preserving the original derivative path."
      ],
      [
        "At w=2,x=3,y=1, what is squared-error gradient for w?",
        "30",
        "25",
        "15",
        "5",
        "The stated arithmetic gives this result: Residual is 5, so 2×5×3=30."
      ],
      [
        "A billing model calls backward on two freshly computed equal losses without clearing. What is expected?",
        "They accumulate",
        "The second replaces the first automatically",
        "Parameters update without an optimizer",
        "Targets are averaged automatically",
        "Gradient buffers accumulate unless explicitly reset."
      ],
      [
        "A scalar loss depends on w only through a detached value. Which statement is accurate?",
        "That path cannot deliver a gradient to w",
        "The gradient must equal the detached value",
        "The model has no parameters left",
        "An optimizer recreates the missing chain",
        "Detachment severs the recorded derivative dependency."
      ],
      [
        "For a=wx,b=2a,L=b at x=4, what is dL/dw?",
        "8",
        "4",
        "2",
        "16",
        "The chain contributes 2 from b to a and 4 from a to w."
      ],
      [
        "A scalar parameter has stored gradient 6. A new forward/backward produces -2 without clearing. What is stored next?",
        "4",
        "-2",
        "6",
        "-12",
        "The new contribution adds to the existing gradient: 6-2=4."
      ],
      [
        "Two equal microbatches each use mean loss and produce gradient 10. The desired combined-batch mean gradient is 10. Which accumulation plan is equivalent?",
        "Backpropagate half each loss, then update once",
        "Backpropagate each full loss, then use the unchanged rate",
        "Clear between batches, then update only once after the second",
        "Add the two losses, then double the learning rate",
        "Scaling each contribution by one half averages the equal microbatch means."
      ],
      [
        "For L=(wx-y)^2 with w=1,x=-2,y=2, gradient descent at rate .1 gives which new w?",
        "-0.6",
        "2.6",
        "0.6",
        "1.8",
        "Residual is -4 and gradient 2×(-4)×(-2)=16; w'=1-1.6=-.6."
      ],
      [
        "A trainer must log loss, accumulate four equal microbatches and avoid graph retention. Which sequence works?",
        "Average four fresh losses; backward; one step",
        "Sum four fresh losses; backward; one step",
        "Average four fresh losses; clear after backward; step",
        "Average four detached losses; backward; one step",
        "Dividing each mean loss by four supplies the combined mean; fresh graphs free normally and logging detaches separately."
      ]
    ]
  },
  {
    "slug": "stable-updates",
    "title": "Diagnose unstable optimization before changing architecture",
    "intro": "A training dashboard shows loss becoming infinite after a few updates. The response should start with the numerical path and data contract. More epochs cannot repair nonfinite inputs or an update that repeatedly jumps outside a stable region.",
    "sections": [
      [
        "Learning rate and gradient scale",
        "Gradient descent updates θ←θ−ηg. For L(w)=w², the update is w←(1−2η)w, which converges to zero for 0<η<1 in exact arithmetic. At η=1 its magnitude oscillates; above one it grows. Neural loss surfaces are more complicated, but this trace explains why a larger rate can destroy rather than accelerate progress.",
        "Check finite inputs, target ranges, loss reduction and gradients before attributing an explosion to model depth. A sum reduction, duplicated batch or changed target scale can magnify gradients. Gradient clipping bounds a chosen gradient norm; it can limit an update without correcting a wrong target or an invalid loss."
      ],
      [
        "Use diagnostics with controlled comparisons",
        "Record learning rate, loss, gradient norm and parameter norm over steps. Reproduce one tiny batch and verify it can be overfit before expanding the run. Compare one change at a time on the development split. An adaptive optimizer has state and still needs a suitable rate; it does not guarantee finite or useful training.",
        "The fixture compares stable and unstable rates on an exact scalar objective using real autograd. It does not establish a universal neural learning rate. Small consistent traces clarify update direction, while validation data determine whether improved optimization also improves generalization."
      ]
    ],
    "code": "import torch\ntorch.set_num_threads(1)\ntorch.manual_seed(7)\ndef run(rate):\n w=torch.tensor(1.,requires_grad=True)\n for _ in range(3):\n  (w*w).backward()\n  with torch.no_grad(): w-=rate*w.grad\n  w.grad=None\n return round(float(w.detach()),3)\nprint(run(.25))\nprint(run(1.5))",
    "expect": "0.125\n-8.0",
    "lang": "python-torch",
    "problem": "Diagnose unstable optimization before changing architecture using the declared synthetic fixture.",
    "steps": [
      "Start both scalar runs at one with fresh gradient buffers.",
      "Apply three autograd steps at each declared learning rate.",
      "Compare the factors 0.5 and -2 that explain the final magnitudes."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual CPU PyTorch 2.15.0+cpu. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Check finite inputs, target ranges, loss reduction and gradients before attributing an explosion to model depth.",
      "The fixture compares stable and unstable rates on an exact scalar objective using real autograd."
    ],
    "takeaways": [
      "Gradient descent updates θ←θ−ηg.",
      "Record learning rate, loss, gradient norm and parameter norm over steps."
    ],
    "practice": [
      [
        "What is the gradient descent parameter update?",
        "theta minus rate times gradient",
        "theta plus loss only",
        "gradient divided by class count always",
        "theta replaced by target",
        "The learning rate scales a step opposite the local gradient."
      ],
      [
        "What does a nonfinite input require first?",
        "Validate finite inputs",
        "Run more epochs unchanged",
        "Add more output classes",
        "Discard the validation labels",
        "Optimizer settings cannot give meaningful derivatives to invalid numerical data."
      ],
      [
        "What does gradient norm clipping directly bound?",
        "The chosen gradient norm",
        "The final generalization gap",
        "The number of input features",
        "Every target's magnitude",
        "Clipping rescales gradients that exceed the configured norm threshold."
      ],
      [
        "A sum reduction replaces a mean reduction. What should be reconsidered?",
        "Gradient scale and learning rate",
        "Only the layer names",
        "Only the model file extension",
        "Only label spelling",
        "The gradient can increase by batch size under the changed reduction."
      ],
      [
        "A finite loss suddenly explodes after the learning rate doubles. What comparison helps?",
        "Reproduce the same batch at both rates",
        "Shuffle labels for the new run",
        "Change rate, depth and targets together",
        "Remove all gradient logging",
        "A controlled trace isolates update-scale effects."
      ],
      [
        "A team says Adam removes learning-rate tuning. What is missing?",
        "Rate remains tunable",
        "Adam has no parameters",
        "Adam cannot compute gradients",
        "Adam always uses zero momentum",
        "Adaptive optimization does not guarantee a stable or useful rate."
      ]
    ],
    "formal": [
      [
        "What diagnostic separates nonfinite data from optimizer instability?",
        "Stagewise finite checks",
        "Only the final filename",
        "Only the total epoch count",
        "Only training-set accuracy",
        "Locating where nonfinite values first appear narrows the faulty path."
      ],
      [
        "What is the gradient of w squared?",
        "2w",
        "w",
        "w squared",
        "1/w",
        "Differentiation gives twice the current scalar parameter."
      ],
      [
        "For w=2 and gradient 3 at rate .1, what is the update?",
        "1.7",
        "2.3",
        ".3",
        "6.0",
        "The stated arithmetic gives this result: Subtract .1×3 from 2."
      ],
      [
        "A trainer doubles batch size while using sum loss. Why can a formerly stable rate fail?",
        "The aggregate gradient scale can grow",
        "The target class count must double",
        "The input schema must shrink",
        "The optimizer becomes stateless",
        "Summed per-example contributions grow with batch size under comparable examples."
      ],
      [
        "A team clips gradients after optimizer.step. What is wrong with the intended bound?",
        "The step already occurred",
        "Clipping changes all labels",
        "The gradient is never stored",
        "The model becomes unsupervised",
        "Clipping must occur before the step whose gradient it is intended to bound."
      ],
      [
        "For L=w² and rate .75, what is the one-step multiplicative factor?",
        "-0.5",
        "0.5",
        "-1.5",
        "1.5",
        "The factor is 1-2×.75=-.5, alternating sign with shrinking magnitude."
      ],
      [
        "A gradient vector (3,4) is clipped to Euclidean norm 2. What vector results?",
        "(1.2,1.6)",
        "(1.5,2)",
        "(3,2)",
        "(0.6,0.8)",
        "The original norm is 5; scaling by 2/5 yields (1.2,1.6)."
      ],
      [
        "For w=1,L=w² and rate 1.2, what is w after two updates?",
        "1.96",
        "-1.96",
        "0.04",
        "-0.4",
        "Each step multiplies by -1.4, so two steps produce 1.96."
      ],
      [
        "A model's gradients become nonfinite before clipping, while all inputs are finite. Which inference is justified?",
        "Inspect numerical path",
        "Increase the clipping threshold to turn NaNs finite",
        "Treat the clipping pass as proof of stable training",
        "Ignore it if one validation example was correct",
        "Finite inputs do not guarantee finite intermediate operations; NaNs cannot be repaired by a norm rescale."
      ],
      [
        "A run uses plain SGD with learning rate0.1, no momentum or weight decay, and a required update-norm limit0.1. The proposed gradient-norm threshold is1. Targets must be valid and loss reduction must stay fixed across rate comparisons. Which plan meets all three?",
        "Validate targets; clip before step; fix comparison settings",
        "Validate targets; clip after step; fix comparison settings",
        "Validate targets; clip before step; change loss reduction too",
        "Assume targets valid; clip before step; fix comparison settings",
        "For the stated plain SGD, clipping gradient norm to1 before step bounds update norm by0.1; clipping after step is too late. Valid targets and fixed loss reduction remain separate requirements. This does not claim gradient clipping alone bounds every optimizer update."
      ]
    ]
  },
  {
    "slug": "generalization-regularization",
    "title": "Separate optimization success from generalization",
    "intro": "A ticket network reaches near-zero training error while validation error rises. The optimizer may be doing its job: it is fitting the supplied examples. The remaining question is whether that fit transfers to unseen tickets under the intended sampling boundary.",
    "sections": [
      [
        "Read paired learning curves",
        "Overfitting is consistent with improving training fit and deteriorating independent validation performance. Underfitting can leave both errors high; label noise or distribution shift can complicate that pattern. Compare a simple baseline, inspect representative mistakes and preserve time or entity boundaries. Reusing a final test set for repeated architecture decisions turns it into development data.",
        "Weight decay or a parameter penalty constrains complexity according to a stated objective. For J=L+λΣw² the derivative contribution is 2λw. Some optimizers implement decoupled weight decay rather than adding this derivative to an adaptive-gradient calculation; name the mechanism rather than treating all settings as identical."
      ],
      [
        "Dropout and early stopping",
        "Dropout randomly masks units during training and uses scaling to preserve the expected activation under its documented convention. PyTorch dropout is inactive in eval mode. Evaluation should disable training-time stochastic behavior and avoid fitting normalization state on holdout data. Early stopping selects a checkpoint using validation evidence; preserve a separate final evaluation for the selected policy.",
        "The fixture applies dropout at probability one half to a vector in eval mode, showing identity rather than claiming a random-mask pattern is fixed forever. It also computes a quadratic penalty explicitly. Neither a penalty nor a dropout switch guarantees a smaller generalization gap on every task."
      ]
    ],
    "code": "import torch\ntorch.set_num_threads(1)\ntorch.manual_seed(7)\ndrop=torch.nn.Dropout(p=.5)\ndrop.eval()\nprint(drop(torch.tensor([2.,4.])).tolist())\nw=torch.tensor([3.,4.])\nprint(float(.1*(w*w).sum()))",
    "expect": "[2.0, 4.0]\n2.5",
    "lang": "python-torch",
    "problem": "Separate optimization success from generalization using the declared synthetic fixture.",
    "steps": [
      "Switch the dropout module to evaluation mode.",
      "Confirm that the fixed vector passes through without masking.",
      "Compute the explicit .1-times-squared-norm penalty for weights three and four."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual CPU PyTorch 2.15.0+cpu. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Weight decay or a parameter penalty constrains complexity according to a stated objective.",
      "The fixture applies dropout at probability one half to a vector in eval mode, showing identity rather than claiming a random-mask pattern is fixed forever."
    ],
    "takeaways": [
      "Overfitting is consistent with improving training fit and deteriorating independent validation performance.",
      "Dropout randomly masks units during training and uses scaling to preserve the expected activation under its documented convention."
    ],
    "practice": [
      [
        "Which curve pattern is consistent with overfitting?",
        "Train↓, validation↑",
        "Both errors must be exactly zero",
        "Only the epoch count rises",
        "All gradient norms stay constant",
        "Improved fit to training data with worse held-out performance is a classic warning."
      ],
      [
        "Which mode disables standard PyTorch dropout?",
        "eval mode",
        "A larger batch size alone",
        "A renamed optimizer",
        "Changing the label dtype",
        "Module evaluation mode changes dropout behavior."
      ],
      [
        "What is the derivative of lambda times w squared?",
        "2 lambda w",
        "lambda only",
        "w squared only",
        "Zero always",
        "The quadratic penalty adds a derivative proportional to the weight."
      ],
      [
        "A team chooses epochs on the final test set every week. What changes?",
        "The test set becomes development evidence",
        "Its examples become training tensors automatically",
        "Its labels become random",
        "Its class count doubles",
        "Repeated selection consumes the independence of a final test."
      ],
      [
        "A validation split contains other rows of the same patient as training. Which issue matters?",
        "Entity leakage",
        "Only dropout probability",
        "Only model depth",
        "Only number formatting",
        "Shared-entity structure can make validation unrealistically easy."
      ],
      [
        "A team uses dropout but leaves the model in training mode for evaluation. What can happen?",
        "Unwanted stochastic validation outputs",
        "Every output becomes the true label",
        "All gradients are automatically clipped",
        "All targets are normalized",
        "Training-mode masking can add evaluation randomness."
      ]
    ],
    "formal": [
      [
        "What is early stopping selecting?",
        "A validation checkpoint",
        "The true causal feature set",
        "A universally optimal architecture",
        "The final test labels",
        "Validation evidence guides the stopping/checkpoint decision."
      ],
      [
        "What role does a separate final test retain?",
        "Independent evaluation",
        "Tune every training hyperparameter",
        "Fit normalization means",
        "Generate additional training labels",
        "It should not repeatedly guide model selection."
      ],
      [
        "For weights (3,4) and penalty .1 times sum of squares, what is the penalty?",
        "2.5",
        ".7",
        "25",
        "5",
        "The squared norm is 9+16=25 and multiplying by .1 gives 2.5."
      ],
      [
        "A model has train error .02 and validation error .25. Which change should be evaluated rather than assumed?",
        "Reduced capacity or regularization",
        "A guarantee that more epochs fix the gap",
        "A claim that low train error proves deployment quality",
        "Replacing validation labels with predictions",
        "The gap motivates controlled generalization experiments, not a guaranteed diagnosis from one number."
      ],
      [
        "A model's validation loss is noisy because dropout remains active. Which first correction fits the intended evaluation?",
        "Call eval before measuring fixed validation data",
        "Increase test-set reuse until a low loss occurs",
        "Discard every hard validation record",
        "Fit dropout masks on validation labels",
        "Evaluation mode removes standard training-time dropout behavior."
      ],
      [
        "With inverted dropout p=.25 and retained activation 6, what is its training output when kept?",
        "8",
        "6",
        "4.5",
        "1.5",
        "Retained units scale by 1/(1-p), so 6/.75=8."
      ],
      [
        "For J=L+.2w² at w=3 and data gradient -2, what is the total derivative?",
        "-0.8",
        "-3.2",
        "-1.4",
        "1.2",
        "Penalty derivative is 2×.2×3=1.2; add it to -2 to get -.8."
      ],
      [
        "Three checkpoints have validation losses .5,.4,.45 and test losses .3,.6,.2. Under a frozen minimum-validation rule, which checkpoint is selected?",
        "The second checkpoint",
        "The third checkpoint",
        "The first checkpoint",
        "Average the test losses to select",
        "Selection must use the specified validation rule; the smallest test loss cannot choose the checkpoint."
      ],
      [
        "A model's train and validation errors both stay high; reducing regularization lowers both on the same clean split. Which conclusion fits this evidence?",
        "Excessive tested constraint",
        "The final test error is proven zero",
        "All forms of data leakage are excluded",
        "The labels are proven noise-free",
        "A controlled paired improvement supports that capacity/constraint interpretation without universal claims."
      ],
      [
        "A hospital needs patient-separated evaluation, repeatable checkpoint selection and deterministic serving dropout behavior. Which plan meets all three?",
        "Group patients; select validation; serve eval",
        "Randomize rows; select validation; serve eval",
        "Group patients; select test; serve eval",
        "Group patients; select validation; serve train",
        "Group separation protects entity boundaries, validation supports selection and eval disables dropout."
      ]
    ]
  },
  {
    "slug": "schedules-validation",
    "title": "Schedule learning rates without crossing evaluation boundaries",
    "intro": "A training job reduces its rate after an initial learning phase. A schedule changes the size of later updates; it does not change which data may guide selection. Engineers must track scheduler timing alongside optimizer steps to make a run reproducible.",
    "sections": [
      [
        "A schedule is an update policy",
        "A fixed schedule may decay after specified epochs or steps. A metric-driven schedule may react to a validation plateau under a documented patience rule. Record whether a step means a batch update or an epoch, the initial rate and the order of scheduler and optimizer calls. Moving one call can shift which rate is applied to the first update.",
        "A momentum optimizer stores more than weights. A warm restart of only model parameters is not an exact continuation of training that used optimizer state and a changing rate. Restore the scheduler counter, optimizer buffers and relevant random-generator state when the goal is to continue the same trajectory."
      ],
      [
        "Use holdout information deliberately",
        "A plateau scheduler can use validation loss if that split is development data. The untouched final test should not trigger rate changes. Report the chosen policy and compare it against a simple constant-rate baseline under the same budget; more scheduling machinery is not proof of a better model.",
        "The fixture uses StepLR with a small parameter and prints the rate after each paired optimizer/scheduler step. It verifies actual PyTorch scheduler behavior, not the convergence of a particular network. Production runs should record rates per update when mixed precision, skipped steps or gradient accumulation changes update timing."
      ]
    ],
    "code": "import torch\ntorch.set_num_threads(1)\ntorch.manual_seed(7)\np=torch.nn.Parameter(torch.tensor(1.))\nopt=torch.optim.SGD([p],lr=.2)\nsched=torch.optim.lr_scheduler.StepLR(opt,step_size=2,gamma=.5)\nrates=[]\nfor _ in range(4):\n opt.zero_grad(set_to_none=True)\n (p*p).backward()\n opt.step()\n sched.step()\n rates.append(round(opt.param_groups[0][\"lr\"],3))\nprint(rates)",
    "expect": "[0.2, 0.1, 0.1, 0.05]",
    "lang": "python-torch",
    "problem": "Schedule learning rates without crossing evaluation boundaries using the declared synthetic fixture.",
    "steps": [
      "Create SGD at rate .2 and a two-step half-rate schedule.",
      "Perform each optimizer update before advancing the scheduler.",
      "Read the resulting rates at steps one through four."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual CPU PyTorch 2.15.0+cpu. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "A momentum optimizer stores more than weights.",
      "The fixture uses StepLR with a small parameter and prints the rate after each paired optimizer/scheduler step."
    ],
    "takeaways": [
      "A fixed schedule may decay after specified epochs or steps.",
      "A plateau scheduler can use validation loss if that split is development data."
    ],
    "practice": [
      [
        "What does a learning-rate scheduler alter?",
        "The update-rate policy",
        "The identity of the target labels",
        "The number of input columns necessarily",
        "The semantics of every feature",
        "A scheduler changes rates according to its defined timing or metric rule."
      ],
      [
        "Which split may guide a plateau scheduler?",
        "Development validation",
        "The repeatedly untouched final test",
        "Only deployment outcomes without labels",
        "The label dictionary alone",
        "Validation is selection evidence; final evaluation should remain separate."
      ],
      [
        "What extra state is needed for momentum training continuation?",
        "Optimizer buffers",
        "Only the model title",
        "Only the module count",
        "Only the final predicted class",
        "Momentum depends on historical optimizer state."
      ],
      [
        "A scheduler runs per batch in one run and per epoch in another. What is different?",
        "The decay timing in updates",
        "Only the chart filename",
        "Only the target dtype",
        "The number of classes automatically",
        "The scheduling unit defines when rate changes occur."
      ],
      [
        "A checkpoint saves only weights. What claim is too strong?",
        "Exact training continuation",
        "Reusable inference parameters",
        "A stored parameter tensor",
        "A basis for evaluation",
        "Optimizer, scheduler and random state may also affect continuation."
      ],
      [
        "A team picks a schedule using the final test each day. What is consumed?",
        "Independent final evaluation",
        "The optimizer's memory only",
        "The activation formula",
        "The tensor's feature axis",
        "The final test becomes part of model-selection evidence."
      ]
    ],
    "formal": [
      [
        "Which artifact explains when a rate decay occurs?",
        "Scheduler configuration and counter",
        "Only a screenshot of final accuracy",
        "Only the model's display name",
        "Only the number of labels",
        "The policy and current position determine the scheduled rate."
      ],
      [
        "What does gamma=.5 mean at a StepLR decay boundary?",
        "Multiply rate by one half",
        "Subtract .5 from all weights",
        "Double the target count",
        "Set loss to .5",
        "The multiplicative factor halves the learning rate at each configured boundary."
      ],
      [
        "Starting at .08 with two half-rate decays gives what rate?",
        ".02",
        ".04",
        ".16",
        ".005",
        "The stated arithmetic gives this result: .08×.5×.5=.02."
      ],
      [
        "A validation plateau reduces rate while test data remain untouched. Which boundary is respected?",
        "Selection versus final evaluation",
        "Training versus no model fitting",
        "Only text versus numeric labels",
        "Only batch versus feature axes",
        "Development data may guide scheduling while the final test remains independent."
      ],
      [
        "A model resumes with the right weights but reset momentum. What can differ?",
        "Its next parameter trajectory",
        "Its feature count necessarily",
        "Its output-label vocabulary necessarily",
        "Its stored tensor shapes necessarily",
        "Momentum buffers influence the next updates even with identical current weights."
      ],
      [
        "A schedule halves every 3 optimizer updates from .1. After 7 completed updates, what rate follows? ",
        ".025",
        ".05",
        ".0125",
        ".1",
        "There have been two boundaries at updates 3 and 6, so the rate is .1/4."
      ],
      [
        "A trainer accumulates 4 microbatches per optimizer step. It decays every 8 scheduler calls. Calling the scheduler each microbatch instead of each step changes the interval to what?",
        "2 optimizer steps",
        "4 optimizer steps",
        "8 optimizer steps",
        "32 optimizer steps",
        "Eight microbatch calls occur over two groups of four, shrinking the intended interval by four."
      ],
      [
        "A plateau rule waits for two consecutive non-improvements after best loss .40. Next losses are .42,.39,.41,.43. When does it first trigger?",
        "After the fourth listed loss",
        "After the second listed loss",
        "After the first listed loss",
        "It cannot trigger in this sequence",
        "The .39 resets the best and patience; .41 and .43 are then two consecutive non-improvements."
      ],
      [
        "A scheduled optimizer has rate .01 at checkpoint but is rebuilt with .1 and only weights loaded. Which statement combines the state effects correctly?",
        "Rate and optimizer history may both alter continuation",
        "The weights force the new rate back to .01 automatically",
        "Only the printed experiment label can change",
        "Parameter shapes prove identical continuation",
        "Current weights do not restore optimizer rate, momentum or scheduler position."
      ],
      [
        "A run needs comparable budgets, valid schedule selection and resumability. Which record is sufficient for those boundaries?",
        "Record update budget and validation rule plus full resume state",
        "Record epoch budget and test rule plus full resume state",
        "Record update budget and validation rule plus weights only",
        "Record update budget and training rule plus optimizer only",
        "The budget and selection rule support comparison, while full relevant state supports continuation."
      ]
    ]
  },
  {
    "slug": "training-loop",
    "title": "Build and verify a deterministic PyTorch training loop",
    "intro": "A junior engineer needs a complete training loop that can be inspected locally. A tiny exact regression task is useful because every operation is visible: forward pass, loss, gradient reset, backward pass and optimizer update.",
    "sections": [
      [
        "The loop owns the order",
        "Set a seed for the fixture and keep CPU thread count bounded. Build tensors with known shapes, instantiate the model and optimizer, then for each step clear old gradients, compute predictions, calculate a scalar loss, call backward and step the optimizer. If clearing occurs after backward but before step, the update loses the derivatives it needed.",
        "Use model.train() while fitting. Use model.eval() and no_grad() for ordinary evaluation: they do different jobs. eval changes module behavior such as dropout; no_grad disables graph construction. Neither by itself changes training labels or guarantees a valid split. Keep learning transformations fitted on training data only."
      ],
      [
        "Check a learnable tiny problem",
        "A tiny dataset should often be overfittable by a suitably expressive model; failure suggests a bug, scale issue or unsuitable objective. Passing that check establishes basic mechanics, not generalization. Print a stable assertion such as a decreasing loss rather than relying on a long sequence of hardware-sensitive decimals.",
        "The fixture initializes a bias-free scalar linear model at zero and learns y=2x on x values one and two. Mean squared loss yields an update that approaches the exact coefficient. The result is deterministic under the stated local CPU profile and uses the actual PyTorch optimizer rather than a manual NumPy substitute."
      ]
    ],
    "code": "import torch\ntorch.set_num_threads(1)\ntorch.manual_seed(7)\nx=torch.tensor([[1.],[2.]])\ny=2*x\nmodel=torch.nn.Linear(1,1,bias=False)\nwith torch.no_grad(): model.weight.zero_()\nopt=torch.optim.SGD(model.parameters(),lr=.1)\nmodel.train()\nfirst=float(torch.nn.functional.mse_loss(model(x),y).detach())\nfor _ in range(12):\n opt.zero_grad(set_to_none=True)\n loss=torch.nn.functional.mse_loss(model(x),y)\n loss.backward()\n opt.step()\nmodel.eval()\nwith torch.no_grad():\n final=float(torch.nn.functional.mse_loss(model(x),y))\nprint(first)\nprint(final<first)\nprint(round(float(model.weight.detach()[0,0]),3))",
    "expect": "10.0\nTrue\n2.0",
    "lang": "python-torch",
    "problem": "Build and verify a deterministic PyTorch training loop using the declared synthetic fixture.",
    "steps": [
      "Initialize the one-weight linear model to zero on y=2x.",
      "Repeat gradient reset, mean squared loss, backward and SGD step twelve times.",
      "Evaluate without graph tracking and compare initial loss, improvement and learned weight."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual CPU PyTorch 2.15.0+cpu. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Use model.train() while fitting.",
      "The fixture initializes a bias-free scalar linear model at zero and learns y=2x on x values one and two."
    ],
    "takeaways": [
      "Set a seed for the fixture and keep CPU thread count bounded.",
      "A tiny dataset should often be overfittable by a suitably expressive model; failure suggests a bug, scale issue or unsuitable objective."
    ],
    "practice": [
      [
        "Which order correctly uses freshly computed gradients?",
        "Zero, forward, loss, backward, step",
        "Step, zero, forward, discard loss",
        "Backward, zero, step without forward",
        "Forward, step, zero without backward",
        "The optimizer needs gradients from the current loss before stepping."
      ],
      [
        "What does model.eval change?",
        "Dropout/module behavior",
        "Every parameter to zero",
        "All targets to probabilities",
        "The optimizer class",
        "Evaluation mode toggles module-specific training behavior."
      ],
      [
        "What does no_grad avoid during evaluation?",
        "Building an autograd graph",
        "Computing numerical predictions",
        "Reading model parameters",
        "Preserving feature order",
        "It disables derivative tracking while numerical operations still execute."
      ],
      [
        "A trainer clears gradients immediately before optimizer.step. What is lost?",
        "Needed gradients",
        "All model layers from memory",
        "The input feature names only",
        "The labels' row count",
        "The update uses gradient buffers, so clearing them first defeats it."
      ],
      [
        "A tiny regression cannot reduce loss. What helps first?",
        "Trace one batch",
        "Add an external dataset download",
        "Publish the current weights",
        "Tune on the final test alone",
        "A small controlled problem makes mechanics failures observable."
      ],
      [
        "A CPU fixture sets a seed. What does it support?",
        "Repeatability within the stated runtime",
        "Identical outputs on every future hardware version",
        "Proof of real-world accuracy",
        "Elimination of all sampling bias",
        "A seed fixes specified randomness without universal portability or validity guarantees."
      ]
    ],
    "formal": [
      [
        "What object applies SGD updates in a standard PyTorch loop?",
        "The optimizer",
        "The label dictionary",
        "The feature-name list",
        "The validation split alone",
        "The optimizer reads gradients and changes its parameters according to its rule."
      ],
      [
        "Which mode should normally be set when fitting dropout modules?",
        "train mode",
        "eval mode always",
        "A target string mode",
        "No tensor mode exists",
        "Training mode enables the intended training-time behavior."
      ],
      [
        "A bias-free Linear(2,1) has how many trainable scalars?",
        "2",
        "1",
        "3",
        "4",
        "There are two input weights and no output bias."
      ],
      [
        "A loop never calls backward but calls step repeatedly. What is missing?",
        "Current loss derivatives",
        "More class names",
        "A different file extension",
        "A validation plot title",
        "The optimizer needs gradients; step does not differentiate the loss itself."
      ],
      [
        "A trainer evaluates with eval but gradients remain enabled. Which statement is accurate?",
        "Mode changed; graphs remain possible",
        "No autograd graph can exist in eval",
        "All parameters become frozen permanently",
        "The optimizer state is erased",
        "eval and derivative tracking are separate mechanisms."
      ],
      [
        "For x=(1,2), y=(2,4), zero scalar weight and mean squared error, what is initial loss?",
        "10",
        "5",
        "20",
        "4",
        "The two squared errors are 4 and 16, averaging to 10."
      ],
      [
        "For that same zero-weight regression, what is the gradient and first weight at rate .1?",
        "Gradient -10, weight 1",
        "Gradient -5, weight .5",
        "Gradient 10, weight -1",
        "Gradient -20, weight 2",
        "The mean derivative is (-4-16)/2=-10, giving w'=0-.1(-10)=1."
      ],
      [
        "A loop's gradient buffer is 5 from the previous batch; current backward adds 3, then SGD uses rate .2 at weight 4. Without clearing, what new weight results?",
        "2.4",
        "3.4",
        "3.0",
        "5.6",
        "Accumulated gradient is 8, so 4-.2×8=2.4."
      ],
      [
        "A model with dropout must produce deterministic fixed-input evaluation without unnecessary derivative storage. Which pair is required?",
        "eval and no_grad",
        "train and no_grad",
        "eval and backward",
        "train and retain_graph",
        "eval disables dropout randomness; no_grad avoids evaluation graph construction."
      ],
      [
        "A loop must learn on train only, check mechanics and keep final evaluation independent. Which workflow meets all three?",
        "Train-fit transforms; tiny train check; validation selection; final test",
        "All-data transforms; tiny train check; validation selection; final test",
        "Train-fit transforms; tiny train check; test selection; final test",
        "Train-fit transforms; tiny test check; validation selection; reused test",
        "The proper boundaries combine a train-owned transform, a mechanics probe and separate selection/final evaluation."
      ]
    ]
  },
  {
    "slug": "transfer-heads",
    "title": "Adapt a pretrained representation through an explicit head",
    "intro": "A team has a licensed pretrained representation but only a small labeled task sample. Transfer learning reuses parameters learned elsewhere. It can reduce data needs, but the feature distribution, preprocessing and output-label contract must still match the new task.",
    "sections": [
      [
        "Replace the task-specific boundary",
        "A backbone maps inputs to features; a new head maps those features to current task logits. Replacing a thousand-class source head with a three-class destination head changes the output contract without discarding the backbone. Verify input normalization, feature shape, label order and licensing before using real pretrained weights. This fixture uses a synthetic stand-in backbone and performs no download.",
        "Freezing a parameter by requires_grad_(False) prevents its gradient from being computed through ordinary autograd. The optimizer should own the intended trainable parameters. A frozen backbone can still contain training-mode state such as batch-normalization running statistics; decide its mode separately rather than equating frozen weights with a fully fixed function."
      ],
      [
        "Stage adaptation using independent evidence",
        "First train a small new head, then consider unfreezing selected upper layers at a conservative rate. A small dataset can overfit a large backbone quickly. Compare against an appropriate baseline and inspect domain-specific errors. A source representation trained on one language or image distribution may transfer unevenly across groups.",
        "The example freezes a tiny Linear backbone and counts only a new head as trainable. It demonstrates the mechanics of a transfer boundary using real PyTorch modules. It does not claim that random synthetic weights are pretrained, that a public checkpoint was loaded or that transfer improves this task."
      ]
    ],
    "code": "import torch\ntorch.set_num_threads(1)\ntorch.manual_seed(7)\nbackbone=torch.nn.Linear(2,3)\nbackbone.requires_grad_(False)\nhead=torch.nn.Linear(3,2)\nmodel=torch.nn.Sequential(backbone,torch.nn.ReLU(),head)\nprint(sum(p.numel() for p in model.parameters() if p.requires_grad))\nprint(model(torch.tensor([[1.,2.]])).shape==torch.Size([1,2]))",
    "expect": "8\nTrue",
    "lang": "python-torch",
    "problem": "Adapt a pretrained representation through an explicit head using the declared synthetic fixture.",
    "steps": [
      "Freeze the synthetic backbone parameters explicitly.",
      "Attach a new biased two-output head over three backbone features.",
      "Count only trainable parameters and check the destination output shape."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual CPU PyTorch 2.15.0+cpu. It makes no dataset, model-provider or network calls. The local backbone is synthetic and randomly initialized, not a loaded pretrained checkpoint. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "Freezing a parameter by requires_grad_(False) prevents its gradient from being computed through ordinary autograd.",
      "The example freezes a tiny Linear backbone and counts only a new head as trainable."
    ],
    "takeaways": [
      "A backbone maps inputs to features; a new head maps those features to current task logits.",
      "First train a small new head, then consider unfreezing selected upper layers at a conservative rate."
    ],
    "practice": [
      [
        "What does a task-specific head map to?",
        "Current task outputs",
        "The source archive URL",
        "The optimizer checkpoint title",
        "The number of training files",
        "A head translates learned features into the destination task's output contract."
      ],
      [
        "What does requires_grad_(False) ordinarily prevent?",
        "Their gradients",
        "All tensor forward computation",
        "Creation of the new head",
        "Any module mode change",
        "Frozen parameters do not request autograd gradients."
      ],
      [
        "What must be checked with actual pretrained weights?",
        "Input/feature contract",
        "Only the download filename length",
        "Only the number of training epochs",
        "Only the source site's color",
        "A representation assumes an input transformation and shape contract."
      ],
      [
        "A team replaces a source head but keeps its old class labels. What is broken?",
        "Destination output semantics",
        "The tensor addition definition",
        "The CPU thread limit",
        "The source file count",
        "New logits must map to the destination class dictionary."
      ],
      [
        "A frozen backbone contains batch normalization in train mode. What may still change?",
        "Running statistics",
        "Frozen weights by ordinary gradient descent",
        "The input image license",
        "The number of head parameters automatically",
        "Module buffers and train/eval behavior are distinct from gradient flags."
      ],
      [
        "A random local backbone is used in a mechanics fixture. What must the lesson avoid claiming?",
        "Pretrained provenance",
        "That it executes PyTorch layers",
        "That its output has a shape",
        "That a head has parameters",
        "Random stand-ins demonstrate boundaries but are not pretrained models."
      ]
    ],
    "formal": [
      [
        "What is transfer learning reusing?",
        "Parameters learned on a source task",
        "Only a source model's filename",
        "The source labels as mandatory new labels",
        "The original training examples necessarily",
        "Transfer initializes or reuses learned representations, subject to task compatibility."
      ],
      [
        "Which operation changes destination class count most directly?",
        "Replace the output head",
        "Rename the batch axis",
        "Sort the input rows",
        "Increase worker count",
        "The output head defines the task-logit width."
      ],
      [
        "A head maps 5 features to 3 logits with bias. How many trainable scalars does it have?",
        "18",
        "15",
        "8",
        "20",
        "Fifteen weights plus three biases give eighteen."
      ],
      [
        "A team freezes all backbone weights but leaves train-mode normalization updates. What must be specified?",
        "Whether buffer updates are intended",
        "Only the class names' capitalization",
        "Only the source model's title",
        "Whether the filename includes frozen",
        "Freezing gradients does not itself freeze running state."
      ],
      [
        "A new task has two classes but receives a 1000-class source head. What is needed?",
        "A destination-task head",
        "A larger batch of unchanged logits",
        "Only a smaller learning rate",
        "Only sorted class indices",
        "The source task output dictionary does not become the destination dictionary automatically."
      ],
      [
        "A backbone maps 4 to 6 features with bias and is frozen; a 6-to-2 biased head is trained. How many parameters update?",
        "14",
        "44",
        "30",
        "12",
        "Only the head's 12 weights plus two biases update; the backbone's thirty scalars remain frozen."
      ],
      [
        "A fixed backbone has 100 parameters and a new head has 12. After one step, a backbone buffer changes but its weights do not. Which interpretation fits?",
        "Weights fixed; buffers changed",
        "The head must have overwritten all backbone weights",
        "No transfer boundary can use buffers",
        "The optimizer updated 112 parameters necessarily",
        "A buffer can change under training-mode state updates without gradient-based weight changes."
      ],
      [
        "Two classes are encoded A=0,B=1 during training but serving swaps them. Scores are (.8,.2). Which user-facing result is correct under training semantics?",
        "A with probability .8",
        "B with probability .8",
        "A with probability .2",
        "Both classes with probability .8",
        "The persisted training dictionary binds the first coordinate to A."
      ],
      [
        "A small task dataset supports head-only fitting; unfreezing all layers improves train loss but worsens validation. Which next decision follows the selection boundary?",
        "Prefer the validated head-only checkpoint while investigating adaptation",
        "Choose full unfreezing because its train loss is lower",
        "Select whichever checkpoint has lower final test loss after many retries",
        "Call the larger model superior without segment evaluation",
        "Independent development performance supports the head-only choice under this comparison."
      ],
      [
        "A transfer plan needs a stable frozen function, new class outputs and no external downloads in the fixture. Which implementation fits?",
        "Synthetic frozen eval backbone; new head; mechanics claim",
        "Synthetic frozen train backbone; new head; fixed-function claim",
        "Random frozen backbone; source head; pretrained claim",
        "Downloaded backbone at verification; new head; offline claim",
        "The function boundary, output task and provenance all need to be explicit."
      ]
    ]
  },
  {
    "slug": "fine-tune-artifacts",
    "title": "Fine-tune selectively and save reproducible model state",
    "intro": "A team has validated head-only transfer and wants to adapt one upper block. Fine-tuning changes selected source parameters using task data. Its release artifact must include the architecture and preprocessing contract needed to interpret the saved tensor state.",
    "sections": [
      [
        "Select updates and rates deliberately",
        "Choose which layers to unfreeze before constructing or updating optimizer parameter groups. Head and backbone groups may use different rates, but they must not duplicate a parameter across groups. If a previously frozen parameter is not owned by the optimizer, setting requires_grad alone will not make that optimizer update it. Inspect trainable names and group membership explicitly.",
        "A smaller backbone rate can limit disruption of source representations; it does not guarantee freedom from catastrophic forgetting. Compare target validation and relevant source or retention checks when preserving prior capabilities matters. Keep sensitive source or target data out of exported metadata; store approved lineage identifiers rather than raw records."
      ],
      [
        "State dictionaries need a compatible program",
        "A state_dict stores parameters and persistent buffers, not a complete statement of task semantics. Reconstruct a compatible architecture, load the state and retain feature order, normalization, class dictionary and tested runtime. Optimizer state is useful for continued training but is not usually required for an inference-only artifact. Treat untrusted serialization as a security boundary and use documented safer loading policies.",
        "The fixture uses an in-memory state dictionary with cloned tensors and a compatible second model. Cloning avoids a live-reference trap when retaining a best checkpoint during continued fitting. No file is downloaded or executed; exact prediction agreement checks this controlled round trip rather than production deployment."
      ]
    ],
    "code": "import torch\ntorch.set_num_threads(1)\ntorch.manual_seed(7)\na=torch.nn.Linear(2,1)\nsaved={k:v.detach().clone() for k,v in a.state_dict().items()}\nb=torch.nn.Linear(2,1)\nb.load_state_dict(saved)\na.eval();b.eval()\nx=torch.tensor([[1.,2.]])\nwith torch.no_grad(): print(torch.equal(a(x),b(x)))\nprint(sorted(saved))",
    "expect": "True\n['bias', 'weight']",
    "lang": "python-torch",
    "problem": "Fine-tune selectively and save reproducible model state using the declared synthetic fixture.",
    "steps": [
      "Clone the first model state tensors into a retained snapshot.",
      "Load them into a second model with matching architecture.",
      "Evaluate both at the same input and compare predictions and state keys."
    ],
    "limit": "This isolated in-memory fixture checks the shown operation on synthetic inputs using actual CPU PyTorch 2.15.0+cpu. It makes no dataset, model-provider or network calls. It does not establish production accuracy, representative sampling or deployment reliability.",
    "mistakes": [
      "A smaller backbone rate can limit disruption of source representations; it does not guarantee freedom from catastrophic forgetting.",
      "The fixture uses an in-memory state dictionary with cloned tensors and a compatible second model."
    ],
    "takeaways": [
      "Choose which layers to unfreeze before constructing or updating optimizer parameter groups.",
      "A state_dict stores parameters and persistent buffers, not a complete statement of task semantics."
    ],
    "practice": [
      [
        "What must happen when unfreezing parameters for an existing optimizer?",
        "Optimizer membership",
        "Only rename the module",
        "Only set eval mode",
        "Only increase validation rows",
        "Gradient flags and optimizer membership are separate requirements."
      ],
      [
        "Why use a smaller rate for a pretrained backbone?",
        "Limit disruption while adapting",
        "Guarantee no forgetting",
        "Eliminate every validation need",
        "Make all gradients zero",
        "A conservative rate controls update scale but provides no universal retention guarantee."
      ],
      [
        "What does a state_dict ordinarily include?",
        "Parameters and persistent buffers",
        "Every raw training record",
        "A human approval decision",
        "The full output-label explanation",
        "Tensor state alone does not encode all task semantics."
      ],
      [
        "A best state dictionary is kept as live tensor references during continued fitting. What is the concern?",
        "Live-reference mutation",
        "Every tensor becomes a label",
        "The optimizer must stop automatically",
        "All inputs become immutable",
        "A cloned snapshot avoids retaining references that follow model updates."
      ],
      [
        "A release loads correct weights with different input normalization. What is unverified?",
        "Equivalent inference behavior",
        "That a tensor file exists",
        "That the state has keys",
        "That the CPU can add numbers",
        "The learned weights assume their training preprocessing contract."
      ],
      [
        "A team loads an untrusted serialized model. What boundary matters?",
        "Trusted loading policy",
        "Only the model title",
        "Only the batch size",
        "Only the validation chart style",
        "Serialization can carry security implications beyond tensor accuracy."
      ]
    ],
    "formal": [
      [
        "What does fine-tuning selected layers change?",
        "Their task-trained parameter values",
        "Only the display labels",
        "Only the reference URL",
        "The number of source tasks necessarily",
        "Selected layers adapt through gradient updates using destination task data."
      ],
      [
        "Which metadata are needed to interpret output coordinates?",
        "The class dictionary",
        "Only the file byte count",
        "Only the epoch title",
        "Only the CPU model",
        "Coordinates require a persisted mapping to task labels."
      ],
      [
        "A head has gradient 2 and rate .1; a backbone scalar has gradient 2 and rate .01. What are their step magnitudes?",
        ".2 and .02",
        ".02 and .2",
        "2 and 2",
        ".1 and .01",
        "Each group's rate multiplies its gradient independently."
      ],
      [
        "A parameter is unfrozen but absent from every optimizer group. What happens under that optimizer?",
        "It receives no optimizer update",
        "It updates at the largest group rate",
        "It updates at a default hidden rate",
        "It is automatically deleted",
        "The optimizer only updates the parameters it owns."
      ],
      [
        "A checkpoint is restored into a different-width head. What should be expected?",
        "A shape-contract mismatch",
        "Automatic semantic compatibility",
        "Guaranteed equal predictions",
        "A valid class dictionary from shapes alone",
        "Architecture shapes must match the stored tensors under the intended loading policy."
      ],
      [
        "A retained best tensor is a direct reference and current weight changes from 1 to 3. Which best-value behavior is the danger?",
        "It can now reflect 3",
        "It must remain 1",
        "It becomes an integer label",
        "It is necessarily deleted",
        "Reference retention can track the changed storage rather than preserve a snapshot."
      ],
      [
        "A backbone scalar w=5 has gradient -4 at rate .001; head v=1 has gradient 3 at rate .1. What are next values?",
        "w=5.004,v=.7",
        "w=4.996,v=1.3",
        "w=5.4,v=.997",
        "w=4.6,v=1.003",
        "Subtracting each group's scaled gradient gives 5+.004 and 1-.3."
      ],
      [
        "A state restores every weight exactly but serving reverses two feature columns. Which conclusion is justified?",
        "Tensor restoration passed; semantic equivalence failed",
        "State restoration automatically corrects feature order",
        "Equal shapes prove equal predictions for all rows",
        "Only optimizer state can repair the feature contract",
        "Input semantics are external to matching stored tensor values."
      ],
      [
        "A target adaptation improves target F1 from .70 to .78 but drops a required retention score from .90 to .72 below a .85 gate. Which release decision follows both criteria?",
        "Hold the candidate despite target improvement",
        "Release solely because target F1 increased",
        "Ignore retention because it uses source-domain data",
        "Average the two metrics without the stated gate",
        "The explicit retention constraint is violated even though target performance improves."
      ],
      [
        "A release needs reproducible inference, resume capability and a preserved best checkpoint. Which bundle fits?",
        "Clone best state; preserve inference contract and resume state",
        "Keep live best state; preserve inference contract and resume state",
        "Clone best state; preserve weights but infer label order",
        "Clone best state; preserve inference contract but reset optimizer",
        "Snapshots preserve chosen values; contracts support inference and full relevant training state supports continuation."
      ]
    ]
  }
],[
  {
    "id": "dl-linear",
    "title": "PyTorch 2.15.0 Linear source and API documentation",
    "url": "https://github.com/pytorch/pytorch/blob/31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457/torch/nn/modules/linear.py",
    "source": {
      "repo": "pytorch/pytorch",
      "commit": "31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457",
      "path": "torch/nn/modules/linear.py",
      "verification": "Official pinned Git source read; local isolated worked examples execute against the declared runtime. Human educational review remains pending."
    }
  },
  {
    "id": "dl-loss",
    "title": "PyTorch 2.15.0 loss API source",
    "url": "https://github.com/pytorch/pytorch/blob/31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457/torch/nn/modules/loss.py",
    "source": {
      "repo": "pytorch/pytorch",
      "commit": "31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457",
      "path": "torch/nn/modules/loss.py",
      "verification": "Official pinned Git source read; local isolated worked examples execute against the declared runtime. Human educational review remains pending."
    }
  },
  {
    "id": "dl-optim",
    "title": "PyTorch 2.15.0 SGD implementation",
    "url": "https://github.com/pytorch/pytorch/blob/31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457/torch/optim/sgd.py",
    "source": {
      "repo": "pytorch/pytorch",
      "commit": "31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457",
      "path": "torch/optim/sgd.py",
      "verification": "Official pinned Git source read; local isolated worked examples execute against the declared runtime. Human educational review remains pending."
    }
  },
  {
    "id": "dl-module",
    "title": "PyTorch 2.15.0 module modes and state API",
    "url": "https://github.com/pytorch/pytorch/blob/31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457/torch/nn/modules/module.py",
    "source": {
      "repo": "pytorch/pytorch",
      "commit": "31a77fc9c0a7c6fff15a1ff58c743f53b1a9d457",
      "path": "torch/nn/modules/module.py",
      "verification": "Official pinned Git source read; local isolated worked examples execute against the declared runtime. Human educational review remains pending."
    }
  }
]);
